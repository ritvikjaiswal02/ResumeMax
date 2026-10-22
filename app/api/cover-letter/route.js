import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { validatePDFMeta, validatePDFBytes, validateJD, sanitizeString } from '@/lib/validate'
import { getProAccess, consumeFreeProUse } from '@/lib/plan'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const PRO_REQUIRED = { error: 'pro_required', message: 'Cover letter generation is a Pro feature' }

export async function POST(request) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ── Pro gate ────────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at, free_pro_uses')
      .eq('id', user.id)
      .single()

    const access = getProAccess(profile, 'cover')
    if (!access) return NextResponse.json(PRO_REQUIRED, { status: 403 })

    // ── Parse form data ─────────────────────────────────────────────────
    const formData      = await request.formData()
    const resumeFile    = formData.get('resume')
    const jobDescription = formData.get('jobDescription')
    const userName      = sanitizeString(formData.get('userName'))

    const pdfCheck = validatePDFMeta(resumeFile)
    if (!pdfCheck.ok) {
      return NextResponse.json({ error: pdfCheck.error }, { status: 400 })
    }

    const jdCheck = validateJD(jobDescription)
    if (!jdCheck.ok) {
      return NextResponse.json({ error: jdCheck.error }, { status: 400 })
    }
    const safeJD = jdCheck.value

    // ── Encode PDF ──────────────────────────────────────────────────────
    const arrayBuffer = await resumeFile.arrayBuffer()
    if (!validatePDFBytes(arrayBuffer)) {
      return NextResponse.json({ error: 'Invalid PDF file content' }, { status: 400 })
    }
    const pdfBase64   = Buffer.from(arrayBuffer).toString('base64')

    const prompt =
      `You are an expert career coach writing a professional cover letter. ` +
      `A PDF resume is attached — read all the content carefully. ` +
      `Write a tailored, compelling cover letter for the job description below.\n\n` +
      `Rules:\n` +
      `- 3-4 tight paragraphs (opening hook, relevant experience, specific value, closing)\n` +
      `- Mirror the language and keywords from the job description naturally\n` +
      `- Specific: reference actual skills and experience from the resume, never make up facts\n` +
      `- Use [Hiring Manager's Name] if unknown, [Company Name] if not in the JD\n` +
      `- Professional but warm tone — not robotic or generic\n` +
      `- NO subject line, NO "Dear Sir/Madam", start directly with the salutation\n` +
      `- End with a strong closing line and "Sincerely,\\n${userName || '[Your Name]'}"\n` +
      `- Plain text only — no markdown, no asterisks, no bullet points\n` +
      `- Return ONLY the cover letter text, nothing else\n\n` +
      `JOB DESCRIPTION:\n${safeJD.slice(0, 3000)}`

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: 'application/pdf', data: pdfBase64 } },
            { text: prompt },
          ],
        }],
        generationConfig: { temperature: 0.7 },
      }),
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('[cover-letter] gemini error:', errText)
      return NextResponse.json({ error: 'Generation failed, please try again' }, { status: 500 })
    }

    const geminiData  = await geminiRes.json()
    const coverLetter = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''

    if (!coverLetter) {
      return NextResponse.json({ error: 'Generation failed, please try again' }, { status: 500 })
    }

    // Spend the free Pro use only now that generation succeeded. If a
    // parallel request already spent it, this one gets no result.
    if (access === 'trial' && !(await consumeFreeProUse(supabase, user.id, 'cover'))) {
      return NextResponse.json(PRO_REQUIRED, { status: 403 })
    }

    console.log(`[cover-letter] generated for user=${user.id}, length=${coverLetter.length}`)
    return NextResponse.json({ coverLetter })

  } catch (error) {
    console.error('[cover-letter] unhandled error:', error)
    return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 })
  }
}
