import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

export async function POST(request) {
  try {
    // ── Parse multipart form data ──────────────────────────────────────
    const formData = await request.formData()
    const resumeFile    = formData.get('resume')
    const jobDescription = formData.get('jobDescription')

    if (!resumeFile || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing resume or job description' },
        { status: 400 }
      )
    }
    if (resumeFile.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are accepted' },
        { status: 400 }
      )
    }
    if (resumeFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max size is 5MB.' },
        { status: 400 }
      )
    }

    // ── Auth check ─────────────────────────────────────────────────────
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[analyze] user=${user.id} | ${resumeFile.name} | ${(resumeFile.size / 1024).toFixed(1)} KB`)

    // ── Usage check ────────────────────────────────────────────────────
    let { data: profile } = await supabase
      .from('profiles')
      .select('analyses_used, plan, analyses_reset_at')
      .eq('id', user.id)
      .single()

    // Auto-create if missing (belt-and-suspenders)
    if (!profile) {
      const startOfMonth = new Date(
        new Date().getFullYear(), new Date().getMonth(), 1
      ).toISOString()
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        plan: 'free',
        analyses_used: 0,
        analyses_reset_at: startOfMonth,
      })
      profile = { analyses_used: 0, plan: 'free', analyses_reset_at: startOfMonth }
    }

    // Monthly reset
    const resetDate = new Date(profile.analyses_reset_at)
    const now = new Date()
    const needsReset =
      resetDate.getMonth() !== now.getMonth() ||
      resetDate.getFullYear() !== now.getFullYear()

    if (needsReset) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      await supabase
        .from('profiles')
        .update({ analyses_used: 0, analyses_reset_at: startOfMonth })
        .eq('id', user.id)
      profile.analyses_used = 0
    }

    // Enforce free limit
    if (profile.plan === 'free' && profile.analyses_used >= 2) {
      return NextResponse.json(
        { error: 'limit_reached', message: 'You have used your 2 free analyses this month' },
        { status: 403 }
      )
    }

    // ── Encode PDF as base64 for Gemini ────────────────────────────────
    // We send the raw PDF to Gemini as inline_data so it can read ALL
    // PDF types — including vector/Canva-style PDFs where pdf-parse
    // returns empty text (text rendered as Bezier paths, no text ops).
    const arrayBuffer = await resumeFile.arrayBuffer()
    const pdfBase64 = Buffer.from(arrayBuffer).toString('base64')

    const prompt =
      `You are a professional resume analyst and ATS expert. ` +
      `A PDF resume is attached. Read all text visible in it carefully, ` +
      `including any text rendered as vectors or paths. ` +
      `Return ONLY valid JSON, no markdown, no backticks, no explanation.\n\n` +
      `Analyze this resume against the job description below and return ONLY this exact JSON structure:\n` +
      `{\n` +
      `  "score": <number 0-100>,\n` +
      `  "verdict": <"poor"|"needs_work"|"good"|"strong">,\n` +
      `  "keywords": {\n` +
      `    "matched": [<array of keyword strings found in both resume and JD>],\n` +
      `    "missing": [<array of important JD keywords absent from resume>]\n` +
      `  },\n` +
      `  "insights": [\n` +
      `    { "severity": <"fix"|"warn"|"ok">, "title": <string>, "body": <string> }\n` +
      `  ],\n` +
      `  "rewrites": [\n` +
      `    { "original": <exact bullet>, "rewritten": <improved bullet> }\n` +
      `  ]\n` +
      `}\n` +
      `Rules:\n` +
      `- score = (matched keywords / total JD keywords) * 100, rounded\n` +
      `- provide 4-6 insights ordered by severity (fix first)\n` +
      `- provide 2-3 rewrites for the weakest resume bullets\n` +
      `- never invent facts, use [X] for unknown metrics\n` +
      `- matched/missing arrays: 5-15 items each\n` +
      `- plain text only in all fields, no markdown asterisks or bold\n\n` +
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
        generationConfig: { temperature: 0.3 },
      }),
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('[gemini] error:', errText)
      return NextResponse.json({ error: 'Analysis failed, please try again' }, { status: 500 })
    }

    const geminiData = await geminiRes.json()
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    let result
    try {
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      result = JSON.parse(cleaned)
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (match) {
        result = JSON.parse(match[0])
      } else {
        console.error('[gemini] parse fail:', rawText)
        return NextResponse.json({ error: 'Analysis failed, please try again' }, { status: 500 })
      }
    }

    // ── Increment usage ────────────────────────────────────────────────
    await supabase
      .from('profiles')
      .update({ analyses_used: profile.analyses_used + 1 })
      .eq('id', user.id)

    return NextResponse.json(result)

  } catch (error) {
    console.error('[analyze] unhandled error:', error)
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }
}
