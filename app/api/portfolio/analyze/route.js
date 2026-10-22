import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  getGitHubProfile,
  getPinnedRepos,
  getLanguages,
  scrapePortfolio,
} from '@/lib/github'
import { TARGET_ROLES, ROLE_PROJECT_MAP, ROLE_SKILL_MAP } from '@/lib/constants'
import { getEffectivePlan } from '@/lib/plan'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', user.id)
      .single()

    const effectivePlan = getEffectivePlan(profile)
    if (effectivePlan !== 'pro') {
      return NextResponse.json(
        {
          error: 'pro_required',
          message: 'Portfolio analysis is a Pro feature',
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const githubUsername = body?.github_username?.trim()
    const portfolioUrl = body?.portfolio_url?.trim() || ''
    const targetRole = body?.target_role?.trim()

    if (!githubUsername) {
      return NextResponse.json(
        { error: 'GitHub username is required' },
        { status: 400 }
      )
    }

    if (!targetRole) {
      return NextResponse.json(
        { error: 'Target role is required' },
        { status: 400 }
      )
    }

    if (!TARGET_ROLES.includes(targetRole)) {
      return NextResponse.json(
        { error: 'Invalid target role selected' },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('[portfolio/analyze] GEMINI_API_KEY is missing')
      return NextResponse.json(
        { error: 'Analysis service is not configured' },
        { status: 500 }
      )
    }

    let githubProfile
    let repos
    let languages

    try {
      ;[githubProfile, repos, languages] = await Promise.all([
        getGitHubProfile(githubUsername),
        getPinnedRepos(githubUsername),
        getLanguages(githubUsername),
      ])
    } catch (error) {
      if (error.message === 'GitHub user not found') {
        return NextResponse.json(
          { error: 'GitHub user not found. Check the username.' },
          { status: 404 }
        )
      }

      if (error.message === 'GitHub API rate limit reached') {
        return NextResponse.json(
          { error: 'GitHub API rate limit reached. Try again in a minute.' },
          { status: 429 }
        )
      }

      throw error
    }

    const portfolioData = await scrapePortfolio(portfolioUrl).catch(() => null)
    const visibleSkills = deriveVisibleSkills({ repos, languages, portfolioData })
    const roleExpectedSkills = ROLE_SKILL_MAP[targetRole] ?? []
    const deterministicSkillGaps = deriveSkillGaps(visibleSkills, roleExpectedSkills)
    const missingProjectTypes = deriveMissingProjectTypes({
      repos,
      targetRole,
      visibleSkills,
    })
    const prompt = buildPortfolioPrompt({
      githubProfile,
      repos,
      languages,
      portfolioData,
      targetRole,
      portfolioUrl,
      visibleSkills,
      roleExpectedSkills,
      deterministicSkillGaps,
      missingProjectTypes,
    })

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
        },
      }),
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('[portfolio/analyze] gemini error:', errText)
      return NextResponse.json(
        { error: 'Analysis failed. Please try again.' },
        { status: 500 }
      )
    }

    const geminiData = await geminiRes.json()
    if (geminiData?.promptFeedback?.blockReason) {
      console.error('[portfolio/analyze] gemini blocked:', geminiData.promptFeedback)
      return NextResponse.json(
        { error: 'Analysis failed. Please try again.' },
        { status: 500 }
      )
    }

    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!rawText) {
      console.error('[portfolio/analyze] empty gemini response:', geminiData)
      throw new Error('Empty Gemini response')
    }

    let result = await parsePortfolioResult(rawText)
    if (!isCompletePortfolioResult(result, repos)) {
      result = await enrichPortfolioResult({
        rawText,
        parsedResult: result,
        repos,
        targetRole,
        hasPortfolioUrl: Boolean(portfolioUrl),
        visibleSkills,
        roleExpectedSkills,
        missingProjectTypes,
      })
    }

    result = normalizePortfolioResult(
      result,
      repos,
      Boolean(portfolioUrl),
      visibleSkills,
      deterministicSkillGaps,
      missingProjectTypes
    )

    try {
      await supabase.from('analyses').insert({
        user_id: user.id,
        type: 'portfolio',
        resume_name: `@${githubUsername}`,
        jd_snippet: `${targetRole}${portfolioUrl ? ` | ${portfolioUrl}` : ''}`,
        job_title: `${targetRole} Portfolio Review`,
        jd_text: portfolioUrl || null,
        score: result.score,
        verdict: result.verdict,
        result,
      })
    } catch (historyError) {
      console.error('[portfolio/analyze] history save failed:', historyError)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[portfolio/analyze] error:', error)
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    )
  }
}

async function parsePortfolioResult(rawText) {
  try {
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()

    return JSON.parse(cleaned)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        // Fall through to Gemini repair pass below.
      }
    }

    console.error(
      '[portfolio/analyze] parse fail raw response:',
      rawText.slice(0, 3000)
    )

    const repaired = await repairPortfolioJson(rawText)
    if (repaired) return repaired

    const salvaged = salvagePartialPortfolioResult(rawText)
    if (salvaged) return salvaged

    throw new Error('Could not parse Gemini response')
  }
}

async function repairPortfolioJson(rawText) {
  const repairPrompt =
    `Convert the following portfolio analysis output into strict valid JSON. ` +
    `Return only a JSON object with these top-level keys: ` +
    `"score", "verdict", "github_profile", "projects", "skills", "portfolio_site", "action_plan". ` +
    `Do not add markdown fences or explanation. Preserve the meaning of the original text.\n\n` +
    `TEXT TO CONVERT:\n${rawText.slice(0, 12000)}`

  const repairRes = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: repairPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000,
      },
    }),
  })

  if (!repairRes.ok) {
    const errText = await repairRes.text()
    console.error('[portfolio/analyze] gemini repair error:', errText)
    return null
  }

  const repairData = await repairRes.json()
  const repairedText = repairData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  if (!repairedText) return null

  try {
    const cleaned = repairedText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()

    return JSON.parse(cleaned)
  } catch {
    const match = repairedText.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        console.error(
          '[portfolio/analyze] repair parse fail:',
          repairedText.slice(0, 3000)
        )
      }
    }

    return null
  }
}

async function enrichPortfolioResult({
  rawText,
  parsedResult,
  repos,
  targetRole,
  hasPortfolioUrl,
  visibleSkills,
  roleExpectedSkills,
  missingProjectTypes,
}) {
  const expectedRepoNames = repos.map((repo) => repo.name).join(', ')
  const partialJson = JSON.stringify(parsedResult ?? {}, null, 2)
  const enrichPrompt =
    `You are fixing an incomplete portfolio review JSON response. ` +
    `Return ONLY valid JSON with every required field populated.\n\n` +
    `Target role: ${targetRole}\n` +
    `Expected repo feedback entries for these repos exactly once each: ${expectedRepoNames}\n` +
    `Portfolio URL provided: ${hasPortfolioUrl}\n` +
    `Visible skills already confirmed from data: ${visibleSkills.join(', ') || 'none'}\n` +
    `Expected skills for role: ${roleExpectedSkills.join(', ') || 'none'}\n` +
    `Likely missing project types: ${missingProjectTypes.join(' | ') || 'none'}\n\n` +
    `Existing partial JSON:\n${partialJson}\n\n` +
    `Original model output:\n${rawText.slice(0, 12000)}\n\n` +
    `Return this exact structure:\n` +
    `{\n` +
    `  "score": number,\n` +
    `  "verdict": "needs_work" | "decent" | "good" | "strong",\n` +
    `  "github_profile": { "score": number, "issues": string[], "positives": string[] },\n` +
    `  "projects": {\n` +
    `    "score": number,\n` +
    `    "repo_feedback": [{ "name": string, "issue": string, "fix": string }],\n` +
    `    "missing_project_types": string[]\n` +
    `  },\n` +
    `  "skills": { "present": string[], "missing": string[], "priority_gaps": string[] },\n` +
    `  "portfolio_site": { "score": number | null, "issues": string[] },\n` +
    `  "action_plan": [{ "priority": number, "action": string, "impact": string }]\n` +
    `}\n\n` +
    `Rules:\n` +
    `- repo_feedback must include every expected repo exactly once.\n` +
    `- action_plan must contain exactly 5 items with priorities 1 through 5.\n` +
    `- If no portfolio URL was provided, set portfolio_site.score to null and portfolio_site.issues to [].\n` +
    `- Do not leave arrays empty unless there is truly no evidence; infer the most likely recruiter-facing gaps from the provided data.\n` +
    `- Return JSON only.`

  const enrichRes = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: enrichPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2200,
      },
    }),
  })

  if (!enrichRes.ok) {
    const errText = await enrichRes.text()
    console.error('[portfolio/analyze] gemini enrich error:', errText)
    return parsedResult
  }

  const enrichData = await enrichRes.json()
  const enrichText = enrichData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  if (!enrichText) return parsedResult

  try {
    return await parsePortfolioResult(enrichText)
  } catch (error) {
    console.error('[portfolio/analyze] enrich parse fail:', error)
    return parsedResult
  }
}

function isCompletePortfolioResult(result, repos) {
  if (!result || typeof result !== 'object') return false
  if (!result.github_profile || !result.projects || !result.skills || !result.portfolio_site) {
    return false
  }

  const repoFeedback = result.projects?.repo_feedback
  const actionPlan = result.action_plan

  if (!Array.isArray(repoFeedback) || repoFeedback.length < repos.length) return false
  if (!Array.isArray(actionPlan) || actionPlan.length < 5) return false
  if (!Array.isArray(result.skills?.present) || !Array.isArray(result.skills?.missing)) {
    return false
  }

  return true
}

function normalizePortfolioResult(
  result,
  repos,
  hasPortfolioUrl,
  visibleSkills,
  deterministicSkillGaps,
  missingProjectTypes
) {
  const safe = result && typeof result === 'object' ? result : {}
  const repoFeedback = Array.isArray(safe.projects?.repo_feedback)
    ? safe.projects.repo_feedback
    : []

  const repoMap = new Map(
    repoFeedback
      .filter((item) => item && typeof item === 'object' && item.name)
      .map((item) => [item.name, item])
  )

  const normalizedRepoFeedback = repos.map((repo) => {
    const existing = repoMap.get(repo.name)
    return {
      name: repo.name,
      issue:
        existing?.issue ||
        buildFallbackRepoIssue(repo),
      fix:
        existing?.fix ||
        buildFallbackRepoFix(repo),
    }
  })

  const actionPlan = Array.isArray(safe.action_plan) ? safe.action_plan : []
  const normalizedActionPlan = [1, 2, 3, 4, 5].map((priority, index) => {
    const existing = actionPlan[index]
    return {
      priority,
      action:
        existing?.action ||
        fallbackActionForPriority(priority, repos, hasPortfolioUrl),
      impact:
        existing?.impact ||
        fallbackImpactForPriority(priority, hasPortfolioUrl),
    }
  })

  const normalizedPresentSkills = mergeSkillLists(
    visibleSkills,
    ensureStringArray(safe.skills?.present, 8)
  ).slice(0, 8)
  const normalizedMissingSkills = mergeSkillLists(
    deterministicSkillGaps.missing,
    ensureStringArray(safe.skills?.missing, 8)
  ).slice(0, 8)
  const normalizedPriorityGaps = mergeSkillLists(
    deterministicSkillGaps.priorityGaps,
    ensureStringArray(safe.skills?.priority_gaps, 3)
  ).slice(0, 3)
  const normalizedMissingProjectTypes = mergeSkillLists(
    missingProjectTypes,
    ensureStringArray(safe.projects?.missing_project_types, 3)
  ).slice(0, 3)

  const githubScore = clampScore(
    safe.github_profile?.score || computeGitHubProfileScore(safe.github_profile, repos)
  )
  const projectScore = clampScore(
    safe.projects?.score || computeProjectScore(repos)
  )
  const skillsScore = computeSkillsScore(
    normalizedPresentSkills,
    deterministicSkillGaps.expectedCount
  )
  const portfolioScore = hasPortfolioUrl
    ? clampNullableScore(safe.portfolio_site?.score ?? 60)
    : null
  const overallScore = computeOverallScore({
    githubScore,
    projectScore,
    skillsScore,
    portfolioScore,
    hasPortfolioUrl,
  })

  return {
    score: overallScore,
    verdict: normalizeVerdictFromScore(overallScore, safe.verdict),
    github_profile: {
      score: githubScore,
      issues: ensureStringArray(safe.github_profile?.issues, 4),
      positives: ensureStringArray(safe.github_profile?.positives, 2),
    },
    projects: {
      score: projectScore,
      repo_feedback: normalizedRepoFeedback,
      missing_project_types: normalizedMissingProjectTypes,
    },
    skills: {
      present: normalizedPresentSkills,
      missing: normalizedMissingSkills,
      priority_gaps: normalizedPriorityGaps,
    },
    portfolio_site: {
      score: portfolioScore,
      issues: hasPortfolioUrl ? ensureStringArray(safe.portfolio_site?.issues, 3) : [],
    },
    action_plan: normalizedActionPlan,
  }
}

function ensureStringArray(value, maxItems) {
  if (!Array.isArray(value)) return []
  return value
    .filter((item) => typeof item === 'string' && item.trim().length > 0)
    .slice(0, maxItems)
}

function clampScore(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.max(0, Math.min(100, Math.round(number)))
}

function clampNullableScore(value) {
  if (value === null || value === undefined) return null
  return clampScore(value)
}

function normalizeVerdict(value) {
  return ['needs_work', 'decent', 'good', 'strong'].includes(value)
    ? value
    : 'needs_work'
}

function normalizeVerdictFromScore(score, fallbackVerdict) {
  if (score >= 75) return 'strong'
  if (score >= 60) return 'good'
  if (score >= 40) return 'decent'
  if (['needs_work', 'decent', 'good', 'strong'].includes(fallbackVerdict)) {
    return fallbackVerdict
  }
  return 'needs_work'
}

function mergeSkillLists(primary, secondary) {
  const values = [...(primary || []), ...(secondary || [])]
  const seen = new Set()
  const output = []

  for (const value of values) {
    if (typeof value !== 'string') continue
    const trimmed = value.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    output.push(trimmed)
  }

  return output
}

function deriveVisibleSkills({ repos, languages, portfolioData }) {
  const detected = new Set()
  const add = (value) => {
    if (typeof value !== 'string' || !value.trim()) return
    const normalized = normalizeTopicToSkill(value.trim())
    if (!normalized || isNoiseSkill(normalized)) return
    detected.add(normalized)
  }

  for (const language of languages) add(language)
  for (const repo of repos) {
    add(repo.language)
    for (const topic of repo.topics || []) add(topic)
    add(extractSkillFromText(repo.description))
    add(extractSkillFromText(repo.name))
    if (repo.homepage) add('Deployment')
    if (repo.has_readme) add('Documentation')
  }
  for (const tech of portfolioData?.tech_mentioned || []) add(tech)

  if (detected.has('Next.js')) detected.add('React')
  if (detected.has('Node.js')) detected.add('REST API')
  if (detected.has('Supabase')) {
    detected.add('PostgreSQL')
    detected.add('Database Design')
    detected.add('Authentication')
  }

  return mergeSkillLists([...detected], []).slice(0, 12)
}

function deriveSkillGaps(visibleSkills, expectedSkills) {
  const visibleSet = new Set(visibleSkills.map((skill) => skill.toLowerCase()))
  const missing = expectedSkills.filter((skill) => !visibleSet.has(skill.toLowerCase()))
  return {
    missing,
    priorityGaps: missing.slice(0, 3),
    expectedCount: expectedSkills.length,
  }
}

function deriveMissingProjectTypes({ repos, targetRole, visibleSkills }) {
  const roleProjects = ROLE_PROJECT_MAP[targetRole] ?? []
  const joinedRepoText = repos
    .map((repo) =>
      `${repo.name} ${repo.description || ''} ${(repo.topics || []).join(' ')} ${repo.language || ''}`
    )
    .join(' ')
    .toLowerCase()
  const skillSet = new Set(visibleSkills.map((skill) => skill.toLowerCase()))

  return roleProjects.filter((projectType) => {
    const lower = projectType.toLowerCase()
    if (lower.includes('auth') && !skillSet.has('authentication')) return true
    if (
      lower.includes('database') &&
      !skillSet.has('postgresql') &&
      !skillSet.has('mongodb') &&
      !joinedRepoText.includes('database')
    ) return true
    if (lower.includes('deployment') && !skillSet.has('deployment')) return true
    if (
      lower.includes('api') &&
      !skillSet.has('rest api') &&
      !joinedRepoText.includes('api')
    ) return true
    if (
      lower.includes('mobile') &&
      !joinedRepoText.includes('react native') &&
      !joinedRepoText.includes('flutter')
    ) return true
    if (
      lower.includes('ml') &&
      !joinedRepoText.includes('machine learning') &&
      !joinedRepoText.includes('model')
    ) return true
    if (
      lower.includes('ci/cd') &&
      !joinedRepoText.includes('ci') &&
      !skillSet.has('docker')
    ) return true
    return false
  }).slice(0, 3)
}

function normalizeTopicToSkill(value) {
  if (!value) return ''
  const normalized = value.replace(/[-_]/g, ' ').trim().toLowerCase()
  const skillMap = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    react: 'React',
    'next js': 'Next.js',
    nextjs: 'Next.js',
    node: 'Node.js',
    'node js': 'Node.js',
    express: 'Express',
    python: 'Python',
    django: 'Django',
    fastapi: 'FastAPI',
    mongodb: 'MongoDB',
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    firebase: 'Firebase',
    supabase: 'Supabase',
    tailwind: 'Tailwind',
    docker: 'Docker',
    graphql: 'GraphQL',
    aws: 'AWS',
    api: 'REST API',
    apis: 'REST API',
    auth: 'Authentication',
    authentication: 'Authentication',
  }

  return skillMap[normalized] || value
}

function isNoiseSkill(value) {
  const noise = new Set([
    'job-search',
    'job search',
    'guide',
    'learning',
    'project',
    'app',
    'website',
  ])

  return noise.has(String(value).trim().toLowerCase())
}

function extractSkillFromText(text) {
  if (!text) return ''
  const content = text.toLowerCase()
  if (content.includes('next')) return 'Next.js'
  if (content.includes('react')) return 'React'
  if (content.includes('node')) return 'Node.js'
  if (content.includes('express')) return 'Express'
  if (content.includes('mongo')) return 'MongoDB'
  if (content.includes('postgres')) return 'PostgreSQL'
  if (content.includes('auth')) return 'Authentication'
  if (content.includes('api')) return 'REST API'
  if (content.includes('deploy')) return 'Deployment'
  if (content.includes('tailwind')) return 'Tailwind'
  return ''
}

function computeProjectScore(repos) {
  let score = 30
  for (const repo of repos) {
    if (repo.description) score += 6
    else score -= 4
    if (repo.has_readme) score += 5
    else score -= 3
    if (repo.homepage) score += 6
    else score -= 2
    if ((repo.topics || []).length > 0) score += 3
    if (repo.stars > 0) score += 2
  }
  return clampScore(Math.min(score, 82))
}

function computeGitHubProfileScore(githubProfileResult, repos) {
  let score = 30
  if ((githubProfileResult?.positives || []).length > 0) score += 10
  if ((githubProfileResult?.issues || []).length <= 2) score += 10
  if (repos.some((repo) => repo.description)) score += 10
  if (repos.some((repo) => repo.has_readme)) score += 10
  return clampScore(score)
}

function computeSkillsScore(visibleSkills, expectedCount) {
  if (!expectedCount) return 0
  const ratio = visibleSkills.length / expectedCount
  return clampScore(Math.round(Math.min(ratio, 1) * 100))
}

function computeOverallScore({
  githubScore,
  projectScore,
  skillsScore,
  portfolioScore,
  hasPortfolioUrl,
}) {
  const portfolioComponent = hasPortfolioUrl ? (portfolioScore ?? 0) * 0.1 : 0
  return clampScore(
    Math.round(
      githubScore * 0.2 +
      projectScore * 0.4 +
      skillsScore * 0.3 +
      portfolioComponent
    )
  )
}

function buildFallbackRepoIssue(repo) {
  if (!repo.description) return `${repo.name} has no description, so recruiters cannot tell what problem it solves.`
  if (!repo.has_readme) return `${repo.name} does not have a visible README, which makes the project hard to evaluate quickly.`
  if (!repo.homepage) return `${repo.name} has no live demo link, so the project lacks a quick proof-of-work entry point.`
  return `${repo.name} needs a clearer recruiter-facing story around its scope, stack, and impact.`
}

function salvagePartialPortfolioResult(rawText) {
  const scoreMatch = rawText.match(/"score"\s*:\s*(\d{1,3})/)
  const verdictMatch = rawText.match(/"verdict"\s*:\s*"([^"]+)"/)
  const githubScoreMatch = rawText.match(/"github_profile"\s*:\s*\{[\s\S]*?"score"\s*:\s*(\d{1,3})/)
  const issuesMatches = [...rawText.matchAll(/"([^"\n]{8,200})"/g)]
    .map((match) => match[1])
    .filter((value) =>
      ![
        'score',
        'verdict',
        'github_profile',
        'projects',
        'skills',
        'portfolio_site',
        'action_plan',
        'issues',
        'positives',
      ].includes(value)
    )

  const topIssues = issuesMatches
    .filter((value) =>
      value.toLowerCase().includes('profile') ||
      value.toLowerCase().includes('location') ||
      value.toLowerCase().includes('website') ||
      value.toLowerCase().includes('account') ||
      value.toLowerCase().includes('github')
    )
    .slice(0, 4)

  if (!scoreMatch && !verdictMatch && !githubScoreMatch && topIssues.length === 0) {
    return null
  }

  return {
    score: scoreMatch ? Number(scoreMatch[1]) : 0,
    verdict: verdictMatch ? verdictMatch[1] : 'needs_work',
    github_profile: {
      score: githubScoreMatch ? Number(githubScoreMatch[1]) : 0,
      issues: topIssues,
      positives: [],
    },
    projects: {
      score: 0,
      repo_feedback: [],
      missing_project_types: [],
    },
    skills: {
      present: [],
      missing: [],
      priority_gaps: [],
    },
    portfolio_site: {
      score: null,
      issues: [],
    },
    action_plan: [],
  }
}

function buildFallbackRepoFix(repo) {
  if (!repo.description) return `Add a one-line description to ${repo.name} that explains the product, stack, and outcome.`
  if (!repo.has_readme) return `Add a README to ${repo.name} with setup steps, features, screenshots, and tech stack.`
  if (!repo.homepage) return `Deploy ${repo.name} or add its working demo URL to the repository homepage field.`
  return `Update ${repo.name} with clearer README sections, measurable outcomes, and a stronger project summary.`
}

function fallbackActionForPriority(priority, repos, hasPortfolioUrl) {
  const firstRepo = repos[0]?.name || 'your best project'
  if (priority === 1) return `Improve ${firstRepo} so it has a strong description, README, and demo link.`
  if (priority === 2) return 'Make sure each showcased repo clearly matches the target role you want recruiters to consider you for.'
  if (priority === 3) return 'Add one project that closes the biggest missing skill gap for your target role.'
  if (priority === 4) return hasPortfolioUrl
    ? 'Tighten the portfolio site so recruiters can quickly find your best projects, role positioning, and contact details.'
    : 'Create or improve a portfolio site so recruiters can review your projects in one place.'
  return 'Polish your GitHub profile with better bio, location, and role-specific positioning.'
}

function fallbackImpactForPriority(priority, hasPortfolioUrl) {
  if (priority === 1) {
    return 'Recruiters decide fast; a clear README, description, and demo make your strongest project instantly legible.'
  }
  if (priority === 2) {
    return 'Role-aligned projects help hiring teams see fit without guessing how your work maps to the job.'
  }
  if (priority === 3) {
    return 'A targeted new project closes the most damaging proof gap in your portfolio.'
  }
  if (priority === 4) {
    return hasPortfolioUrl
      ? 'A cleaner portfolio site reduces friction and helps reviewers find your best work in seconds.'
      : 'A portfolio site gives recruiters one polished place to review your best projects and contact details.'
  }
  return 'A stronger GitHub profile increases credibility before anyone opens an individual repository.'
}

function buildPortfolioPrompt({
  githubProfile,
  repos,
  languages,
  portfolioData,
  targetRole,
  portfolioUrl,
  visibleSkills,
  roleExpectedSkills,
  deterministicSkillGaps,
  missingProjectTypes,
}) {
  const repoSummary = repos
    .map(
      (repo) =>
        `- ${repo.name}: ${repo.description || 'no description'} | ` +
        `lang: ${repo.language || 'unknown'} | ` +
        `stars: ${repo.stars} | ` +
        `has README: ${repo.has_readme} | ` +
        `live demo: ${repo.homepage ? 'yes' : 'no'} | ` +
        `topics: ${repo.topics.join(', ') || 'none'}`
    )
    .join('\n')

  const portfolioSummary = portfolioData
    ? `
Portfolio website (${portfolioUrl}):
- Title: ${portfolioData.title || 'not set'}
- Has projects section: ${portfolioData.has_projects_section}
- Has contact info: ${portfolioData.has_contact}
- Has about section: ${portfolioData.has_about}
- Technologies mentioned: ${portfolioData.tech_mentioned.join(', ') || 'none detected'}
- Notable links: ${portfolioData.links.join(', ') || 'none detected'}
`
    : 'No portfolio website provided.'

  return `Analyze this developer's GitHub profile and portfolio for a ${targetRole} role.

GITHUB PROFILE:
- Username: ${githubProfile.login}
- Name: ${githubProfile.name || 'not set'}
- Bio: ${githubProfile.bio || 'not set'}
- Location: ${githubProfile.location || 'not set'}
- Website: ${githubProfile.blog || 'not set'}
- Public repos: ${githubProfile.public_repos}
- Followers: ${githubProfile.followers}
- Account age: created ${githubProfile.created_at?.split('T')[0]}

TOP REPOSITORIES:
${repoSummary}

LANGUAGES USED (by code volume):
${languages.join(', ') || 'none detected'}

${portfolioSummary}

TARGET ROLE: ${targetRole}

VISIBLE SKILLS DETECTED FROM DATA:
${visibleSkills.join(', ') || 'none detected'}

EXPECTED ROLE SKILLS:
${roleExpectedSkills.join(', ') || 'none provided'}

DETERMINISTIC SKILL GAPS:
${deterministicSkillGaps.missing.join(', ') || 'none'}

LIKELY MISSING PROJECT TYPES:
${missingProjectTypes.join(' | ') || 'none detected'}

Interpretation guidance:
- These repos are the candidate's most recently updated public repos used as an MVP proxy for pinned projects.
- Evaluate the visible evidence only. If something is missing from the data, treat it as not visible to a recruiter.
- Focus on recruiter impact: clarity, completeness, polish, relevance, and proof of skill.

Return ONLY this exact JSON structure:
{
  "score": <number 0-100, weighted: github_profile 20%, projects 40%, skills 30%, portfolio_site 10%>,
  "verdict": <"needs_work"|"decent"|"good"|"strong">,
  "github_profile": {
    "score": <number 0-100>,
    "issues": [<specific actionable fix strings, max 4>],
    "positives": [<what is already good, max 2>]
  },
  "projects": {
    "score": <number 0-100>,
    "repo_feedback": [
      {
        "name": <repo name>,
        "issue": <specific problem with this repo>,
        "fix": <exactly what to add or change>
      }
    ],
    "missing_project_types": [<project types missing for this role, max 3>]
  },
  "skills": {
    "present": [<skills visible from repos and portfolio>],
    "missing": [<important skills for ${targetRole} not visible anywhere>],
    "priority_gaps": [<top 3 most important missing skills to add first>]
  },
  "portfolio_site": {
    "score": <number 0-100, or null if no URL provided>,
    "issues": [<specific fixes, max 3>]
  },
  "action_plan": [
    {
      "priority": <1-5, 1 is most urgent>,
      "action": <specific thing to do>,
      "impact": <why this matters to recruiters>
    }
  ]
}

Rules:
- Be specific and direct, not generic. Reference actual repo names and visible portfolio details.
- action_plan must have exactly 5 items ordered by priority.
- missing skills must be real gaps for ${targetRole}, not random.
- Use the visible skills and deterministic gaps above as hard evidence. Do not leave skills arrays empty.
- Use the likely missing project types above unless the repo evidence clearly disproves them.
- repo_feedback must cover every repo provided exactly once.
- If no portfolio URL was provided, set portfolio_site.score to null and portfolio_site.issues to [].
- Keep every string in plain text only. No markdown in any field.
- Prefer concrete fixes like "Add a deployed demo link to repo X" over vague advice like "improve presentation".
- Reward clear evidence of production readiness: deployment, documentation, maintained activity, strong descriptions, and relevant stack depth.
- Penalize missing README files, missing descriptions, no visible live demo where one would help, and weak alignment to the target role.`
}
