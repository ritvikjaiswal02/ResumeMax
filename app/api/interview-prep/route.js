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
        { error: 'pro_required', message: 'Interview Prep is a Pro feature' },
        { status: 403 }
      )
    }

    // ── Parse form data ─────────────────────────────────────────────────
    const formData       = await request.formData()
    const resumeFile     = formData.get('resume')
    const jobDescription = formData.get('jobDescription')

    if (!resumeFile || !jobDescription) {
      return NextResponse.json({ error: 'Missing resume or job description' }, { status: 400 })
    }
    if (resumeFile.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
    }

    // ── Encode PDF ──────────────────────────────────────────────────────
    const arrayBuffer = await resumeFile.arrayBuffer()
    const pdfBase64   = Buffer.from(arrayBuffer).toString('base64')

    const prompt =
      `You are an expert interview coach. A PDF resume is attached — read every word carefully. ` +
      `Generate 6-8 interview questions for the job description below.\n\n` +
      `DISTRIBUTION:\n` +
      `- 2-3 Behavioral (STAR-based)\n` +
      `- 2-3 Technical / Domain\n` +
      `- 1-2 Situational / Problem-solving\n\n` +
      `CRITICAL RULES:\n` +
      `1. PERSONALIZATION — each question MUST relate to the job description. Each tip MUST reference a REAL project, skill, or experience from this specific resume. Never invent anything.\n` +
      `2. REALISTIC QUESTIONS — sound like a real interviewer. Never ask generic questions like "Tell me about yourself" or "What are your strengths?"\n` +
      `3. ACTIONABLE TIPS — each tip must say WHAT to mention and HOW to frame it. Bad tip: "Talk about your experience confidently." Good tip: "Reference your ResumeMax project — explain how you handled API latency and what tradeoffs you made."\n` +
      `4. LEVEL MATCHING — adjust difficulty based on role seniority. If JD mentions system design, include a deeper technical question.\n` +
      `5. STYLE — clear, concise, natural language. No markdown. No fluff.\n\n` +
      `Return ONLY valid JSON, no markdown, no backticks:\n` +
      `{\n` +
      `  "questions": [\n` +
      `    {\n` +
      `      "category": "Behavioral" | "Technical" | "Situational",\n` +
      `      "question": <string — what the interviewer asks>,\n` +
      `      "tip": <string — 1-2 sentences: what to mention and how to frame it using their actual resume>\n` +
      `    }\n` +
      `  ]\n` +
      `}\n\n` +
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
        generationConfig: { temperature: 0.5 },
      }),
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('[interview-prep] gemini error:', errText)
      return NextResponse.json({ error: 'Generation failed, please try again' }, { status: 500 })
    }

    const geminiData = await geminiRes.json()
    const rawText    = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    let parsed
    try {
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (match) parsed = JSON.parse(match[0])
      else {
        console.error('[interview-prep] parse fail:', rawText)
        return NextResponse.json({ error: 'Generation failed, please try again' }, { status: 500 })
      }
    }

    if (!Array.isArray(parsed?.questions) || parsed.questions.length === 0) {
      return NextResponse.json({ error: 'Generation failed, please try again' }, { status: 500 })
    }

    console.log(`[interview-prep] generated ${parsed.questions.length} questions for user=${user.id}`)
    return NextResponse.json({ questions: parsed.questions })

  } catch (error) {
    console.error('[interview-prep] unhandled error:', error)
    return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 })
  }
}
