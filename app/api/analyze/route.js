import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { validatePDFMeta, validatePDFBytes, validateJD, checkRateLimit } from '@/lib/validate'
import { getEffectivePlan } from '@/lib/plan'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

export async function POST(request) {
  try {
    // ── Parse multipart form data ──────────────────────────────────────
    const formData = await request.formData()
    const resumeFile    = formData.get('resume')
    const jobDescription = formData.get('jobDescription')

    // ── Input validation (before auth to fail fast) ────────────────────
    const pdfCheck = validatePDFMeta(resumeFile)
    if (!pdfCheck.ok) {
      return NextResponse.json({ error: pdfCheck.error }, { status: 400 })
    }

    const jdCheck = validateJD(jobDescription)
    if (!jdCheck.ok) {
      return NextResponse.json({ error: jdCheck.error }, { status: 400 })
    }
    const safeJD = jdCheck.value

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

    // ── Rate limit (per user, in-process) ─────────────────────────────
    const rl = checkRateLimit(user.id, { maxRequests: 20, windowMs: 60_000 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      )
    }

    console.log(`[analyze] user=${user.id} | ${resumeFile.name} | ${(resumeFile.size / 1024).toFixed(1)} KB`)

    // ── Usage check ────────────────────────────────────────────────────
    let { data: profile } = await supabase
      .from('profiles')
      .select('analyses_used, plan, plan_expires_at, analyses_reset_at, bonus_analyses')
      .eq('id', user.id)
      .single()

    // Auto-create if missing (belt-and-suspenders)
    if (!profile) {
      const startOfMonth = new Date(
        new Date().getFullYear(), new Date().getMonth(), 1
      ).toISOString()
      const { error: insertErr } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        plan: 'free',
        analyses_used: 0,
        analyses_reset_at: startOfMonth,
      })
      if (insertErr) console.error('[profiles] insert error:', insertErr.message)
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

    // Enforce free limit (an expired pass counts as free)
    const freeLimit = 5 + (profile.bonus_analyses ?? 0)
    if (getEffectivePlan(profile) !== 'pro' && profile.analyses_used >= freeLimit) {
      return NextResponse.json(
        { error: 'limit_reached', message: `You have used your ${freeLimit} free analyses this month` },
        { status: 403 }
      )
    }

    // ── Encode PDF as base64 for Gemini ────────────────────────────────
    // We send the raw PDF to Gemini as inline_data so it can read ALL
    // PDF types — including vector/Canva-style PDFs where pdf-parse
    // returns empty text (text rendered as Bezier paths, no text ops).
    const arrayBuffer = await resumeFile.arrayBuffer()
    if (!validatePDFBytes(arrayBuffer)) {
      return NextResponse.json({ error: 'Invalid PDF file content' }, { status: 400 })
    }
    const pdfBase64 = Buffer.from(arrayBuffer).toString('base64')

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const prompt =
      `You are a professional resume analyst and ATS expert. ` +
      `Today's date is ${today}. Use this to correctly evaluate whether resume dates are past, current, or future. ` +
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
      `  ],\n` +
      `  "ats_summary": <one sentence: overall ATS compatibility verdict, e.g. "Your resume is well-structured but missing a summary section and has inconsistent date formatting.">,\n` +
      `  "ats_structure": [\n` +
      `    { "type": <"error"|"warning"|"good">, "title": <string>, "description": <string> }\n` +
      `  ]\n` +
      `}\n` +
      `Rules:\n` +
      `- SCORING — use a weighted holistic model, not a keyword count ratio:\n` +
      `    Keyword coverage  40 pts  (matched important JD keywords / total important JD keywords)\n` +
      `    Experience depth  30 pts  (does the candidate's experience match the role level, responsibilities, and domain?)\n` +
      `    Skills alignment  20 pts  (do listed technologies and tools satisfy the core requirements?)\n` +
      `    Resume quality    10 pts  (quantified bullets, clear structure, no red flags)\n` +
      `  Add all four components. Round to nearest integer. Be calibrated:\n` +
      `  - A resume that matches most keywords AND has relevant experience should score 70–90.\n` +
      `  - A resume that matches most keywords but lacks depth should score 50–70.\n` +
      `  - A resume that is largely irrelevant to the JD should score below 40.\n` +
      `  - Never inflate or deflate artificially. A strong junior resume for a junior role can score 80+.\n` +
      `  - Missing 2–3 minor keywords should NOT drag an otherwise strong resume below 60.\n` +
      `- verdict thresholds: score >= 75 → "strong", score >= 55 → "good", score >= 35 → "needs_work", else → "poor"\n` +
      `- provide 4-6 insights ordered by severity (fix first)\n` +
      `- rewrites: include ALL bullet points from the resume's Experience section that would benefit from improvement — however many that is. Skip bullets that are already strong and well-matched to the JD. Do not cap at 2-3; if the resume has 8 weak bullets, rewrite all 8.\n` +
      `- never invent facts, use [X] for unknown metrics\n` +
      `- matched/missing arrays: 5-15 items each\n` +
      `- keywords must be SHORT (1-4 words max): skills, tools, technologies, or brief role terms — NEVER full sentences or job responsibilities\n` +
      `- plain text only in all fields, no markdown asterisks or bold\n` +
      `- ats_summary: one specific sentence — overall ATS verdict. Mention the 1-2 most important issues by name. Not generic.\n` +
      `- ats_structure: STRICT evaluation. Only flag things that ACTUALLY break ATS parsing or cause rejections.\n` +
      `  HIGH-IMPACT issues worth flagging (error/warning):\n` +
      `    * Entire critical section missing: no Skills section, no Experience section, no Education section\n` +
      `    * Contact info absent or buried (no email, no phone at top)\n` +
      `    * Experience written as paragraphs with no bullets (ATS cannot parse responsibilities)\n` +
      `    * Dates completely absent from jobs/education\n` +
      `    * Section headers are non-standard (e.g. "My Journey" instead of "Experience")\n` +
      `  DO NOT FLAG (these are nitpicks that do not affect ATS parsing):\n` +
      `    * GPA format or placement — irrelevant to ATS\n` +
      `    * Minor date inconsistencies (having a year-only entry is fine)\n` +
      `    * Missing summary/objective — optional, not an ATS requirement\n` +
      `    * Slight formatting preferences\n` +
      `    * Things that are present but "could be better"\n` +
      `  For GOOD items: only highlight genuine strengths (has skills section, has bullets, contact info present)\n` +
      `  Provide 3-5 items MAXIMUM. Quality over quantity. If the resume is structurally solid, say so — do not invent warnings.\n` +
      `  Each description: state what is wrong/good, why it matters to ATS, and exactly what to fix (if applicable).\n\n` +
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

    // ── Save to history (non-blocking) ────────────────────────────────
    // Extract job title: first non-empty line of the JD, max 80 chars
    const jobTitle = safeJD.split('\n').map(l => l.trim()).find(l => l.length > 2)?.slice(0, 80) || 'Resume Analysis'

    try {
      await supabase.from('analyses').insert({
        user_id: user.id,
        resume_name: resumeFile.name || 'resume.pdf',
        jd_snippet: safeJD.slice(0, 120),
        jd_text: safeJD.slice(0, 3000),
        job_title: jobTitle,
        score: result.score,
        verdict: result.verdict,
        result,
      })
    } catch (historyErr) {
      console.error('[history] save failed (non-blocking):', historyErr)
    }

    // ── Increment usage ────────────────────────────────────────────────
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ analyses_used: profile.analyses_used + 1 })
      .eq('id', user.id)
    if (updateErr) console.error('[profiles] update error:', updateErr.message)
    else console.log(`[profiles] analyses_used → ${profile.analyses_used + 1} for ${user.id}`)

    return NextResponse.json(result)

  } catch (error) {
    console.error('[analyze] unhandled error:', error)
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }
}
