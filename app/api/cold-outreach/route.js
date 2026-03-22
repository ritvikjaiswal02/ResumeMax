import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

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
      .select('plan')
      .eq('id', user.id)
      .single()

    if (!profile || profile.plan !== 'pro') {
      return NextResponse.json(
        { error: 'pro_required', message: 'Cold outreach generation is a Pro feature' },
        { status: 403 }
      )
    }

    // ── Parse form data ─────────────────────────────────────────────────
    const formData       = await request.formData()
    const resumeFile     = formData.get('resume')
    const jobDescription = formData.get('jobDescription')
    const userName       = formData.get('userName') || ''
    const recruiterName  = formData.get('recruiterName') || ''
    const companyName    = formData.get('companyName') || ''

    if (!resumeFile || !jobDescription) {
      return NextResponse.json({ error: 'Missing resume or job description' }, { status: 400 })
    }
    if (resumeFile.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
    }

    // ── Encode PDF ──────────────────────────────────────────────────────
    const arrayBuffer = await resumeFile.arrayBuffer()
    const pdfBase64   = Buffer.from(arrayBuffer).toString('base64')

    const salutation  = recruiterName ? `Hi ${recruiterName}` : 'Hi there'
    const company     = companyName   || '[Company]'
    const sender      = userName      || '[Your Name]'

    const prompt =
      `You are an expert career coach writing outreach messages for a job seeker. ` +
      `You are a job outreach assistant. A PDF resume is attached — read it carefully.\n` +
      `Generate BOTH a Cold Email AND a LinkedIn DM for the job described below.\n` +
      `Return ONLY valid JSON, no markdown, no backticks, no explanation.\n\n` +
      `Return exactly this structure:\n` +
      `{ "coldEmail": { "subject": "...", "body": "..." }, "linkedInDm": "..." }\n\n` +
      `LINKEDIN DM RULES:\n` +
      `- Max 280 characters STRICT — count carefully\n` +
      `- 2-3 sentences only\n` +
      `- Must: (1) reference the role or company "${company}", (2) mention ONE real project or achievement from the resume\n` +
      `- Conversational tone — like a real person reaching out, slight confidence and energy\n` +
      `- End with a soft CTA (connect / learn more)\n` +
      `- AVOID: generic intros like "I am a full stack developer...", empty claims without proof, overly formal tone\n` +
      `- You MAY use terms like "full-stack", "scalable", "APIs" — but only tied to a specific example from the resume\n\n` +
      `COLD EMAIL RULES:\n` +
      `- 120-150 words max in the body\n` +
      `- 3-4 short paragraphs (1-2 lines each)\n` +
      `- Structure: (1) role + company context, (2) specific project or achievement with tech, (3) why it aligns with the role, (4) simple confident CTA\n` +
      `- Salutation: "${salutation}," — use this exactly\n` +
      `- Sign-off: "Best,\\n${sender}"\n` +
      `- AVOID: "I am excited to apply", "I am passionate about", copy-pasting resume tone\n` +
      `- Style: clear, direct, slightly energetic — feels like a smart candidate, not AI\n\n` +
      `GLOBAL RULES:\n` +
      `- Use SPECIFIC details from resume — do NOT invent anything\n` +
      `- Show proof over claims\n` +
      `- Plain text only — no asterisks, no bullet points, no markdown\n\n` +
      `JOB DESCRIPTION:\n${jobDescription.toString().slice(0, 3000)}`

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
      console.error('[cold-outreach] gemini error:', errText)
      return NextResponse.json({ error: 'Generation failed, please try again' }, { status: 500 })
    }

    const geminiData = await geminiRes.json()
    const raw        = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''

    if (!raw) {
      return NextResponse.json({ error: 'Generation failed, please try again' }, { status: 500 })
    }

    let parsed
    try {
      const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      console.error('[cold-outreach] json parse error, raw:', raw.slice(0, 200))
      return NextResponse.json({ error: 'Generation failed, please try again' }, { status: 500 })
    }

    if (!parsed?.coldEmail?.subject || !parsed?.coldEmail?.body || !parsed?.linkedInDm) {
      return NextResponse.json({ error: 'Generation failed, please try again' }, { status: 500 })
    }

    console.log(`[cold-outreach] generated for user=${user.id}`)
    return NextResponse.json({
      coldEmail:  parsed.coldEmail,
      linkedInDm: parsed.linkedInDm,
    })

  } catch (error) {
    console.error('[cold-outreach] unhandled error:', error)
    return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 })
  }
}
