'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, CircleAlert, FolderGit2, Gauge, Github, Globe, ListChecks, Lock, Pencil, Sparkles, Target } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { analyzePortfolio, getUsage } from '@/lib/api'
import { TARGET_ROLES } from '@/lib/constants'
import PortfolioResults from '@/components/PortfolioResults'
import AppNav from '@/components/landing/AppNav'
import { PrimaryButton, SecondaryButton, Stage, Surface, ToolTag } from '@/components/landing/primitives'
import { INK, LINE, MIST, MUTED, TEXT, TOOLS } from '@/components/landing/tokens'
import { ProgressSteps, Skeleton } from '@/components/landing/Loader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const TOOL = TOOLS.portfolio

function normalizeError(error) {
  const message = error?.error || error?.message || ''
  if (message.includes('GitHub user not found')) {
    return "We couldn't find that GitHub username. Double-check it and try again."
  }
  if (message.includes('GitHub API rate limit reached')) {
    return "GitHub's API is busy right now. Wait a minute and try again."
  }
  if (message === 'pro_required') {
    return 'Portfolio review is part of Pro'
  }
  return 'The review didn’t go through. Please try again.'
}

const fieldClass =
  'h-12 w-full rounded-[12px] border border-[#E3E6E1] bg-white pl-10 pr-4 text-[15px] text-[#0D0F0E] shadow-none outline-none transition-colors placeholder:text-[#8A908C] hover:border-[#D5D9D3] focus-visible:border-[#0D0F0E] focus-visible:ring-2 focus-visible:ring-[#0D0F0E]/10 md:text-[15px]'

function FieldIcon({ Icon }) {
  return (
    <Icon
      aria-hidden
      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2"
      strokeWidth={1.75}
      style={{ color: MUTED }}
    />
  )
}

function FormSkeleton() {
  return (
    <Surface className="flex flex-col gap-6 p-5 sm:p-7" role="status" aria-label="Loading your account">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-12 w-full rounded-[12px]" />
        </div>
      ))}
      <Skeleton className="h-12 w-full" style={{ background: TOOL.tint }} />
    </Surface>
  )
}

const FEATURES = [
  { Icon: Gauge, title: 'A score out of 100', copy: 'Weighted across your profile, projects, skills and site.' },
  { Icon: FolderGit2, title: 'Repo-by-repo fixes', copy: 'What a reviewer sees in each repo, and what to change.' },
  { Icon: ListChecks, title: 'A 5-step plan', copy: 'The changes that move your score most, in order.' },
]

function LockedState() {
  return (
    <Surface className="mx-auto max-w-[560px] px-6 py-10 text-center sm:px-10">
      <div
        className="mx-auto flex size-12 items-center justify-center rounded-full"
        style={{ background: TOOL.tint, color: TOOL.deep }}
      >
        <Lock aria-hidden className="size-5" strokeWidth={1.75} />
      </div>
      <h2 className="mt-5 text-[22px] font-medium tracking-[-0.02em]" style={{ color: INK }}>
        You&apos;ve used your free reviews
      </h2>
      <p className="mx-auto mt-2 max-w-[400px] text-[15px] leading-[1.6]" style={{ color: MUTED }}>
        Free accounts get 2 portfolio reviews. Get a Pro Pass to review your GitHub as often as you like.
      </p>
      <PrimaryButton href="/pricing" className="mt-6">
        See Pro plans
      </PrimaryButton>
    </Surface>
  )
}

function ReportMeta({ portfolioUrl, targetRole }) {
  const chip = 'inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-[13.5px] font-medium'
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <span className={chip} style={{ background: MIST, color: INK }}>
        <Target aria-hidden className="size-3.5 shrink-0" /> <span className="truncate">{targetRole}</span>
      </span>
      <span className={chip} style={{ background: MIST, color: portfolioUrl ? INK : MUTED }}>
        <Globe aria-hidden className="size-3.5 shrink-0" /> <span className="truncate">{portfolioUrl || 'No portfolio site'}</span>
      </span>
    </div>
  )
}

export default function PortfolioPage() {
  const router = useRouter()
  const { user, session, loading: authLoading, signOut } = useAuth()
  const [usage, setUsage] = useState(null)
  const [usageLoading, setUsageLoading] = useState(true)
  const [githubUsername, setGithubUsername] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [targetRole, setTargetRole] = useState('Full Stack Developer')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    if (!session?.access_token) return

    getUsage(session.access_token)
      .then(setUsage)
      .catch(() => {})
      .finally(() => setUsageLoading(false))
  }, [authLoading, router, session, user])

  const isPro = useMemo(() => usage?.plan === 'pro', [usage])
  const freeLeft = usage?.free_pro_left?.portfolio ?? 0
  const canUse = isPro || freeLeft > 0

  async function handleSubmit(event) {
    event.preventDefault()
    if (!session?.access_token || !canUse) return

    setLoading(true)
    setError('')

    try {
      const cleanedUsername = githubUsername.trim().replace(/^@+/, '')
      const data = await analyzePortfolio(
        cleanedUsername,
        portfolioUrl.trim(),
        targetRole,
        session.access_token
      )
      setResult(data)
      setGithubUsername(cleanedUsername)
      if (!isPro) {
        setUsage((u) => (u ? { ...u, free_pro_left: { ...u.free_pro_left, portfolio: Math.max(0, freeLeft - 1) } } : u))
      }
    } catch (err) {
      const message = normalizeError(err)
      if ((err?.error || err?.message) === 'pro_required') {
        setUsage((current) => ({ ...(current || {}), plan: 'free', free_pro_left: { ...(current?.free_pro_left || {}), portfolio: 0 } }))
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  function resetAnalysis() {
    setResult(null)
    setError('')
  }

  return (
    <div className="rmx min-h-screen bg-white">
      <AppNav active="portfolio" user={user} usage={usage} onSignOut={signOut} loading={authLoading} />

      <main className="mx-auto max-w-[1200px] px-5 pb-24 pt-10 sm:px-8 sm:pt-16">
        {!result ? (
          <div className="anim-fade-up grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] lg:items-start lg:gap-16">
            <div className="lg:pt-6">
              <ToolTag tool="portfolio" />
              <h1
                className="mt-5 font-medium"
                style={{ color: INK, fontSize: 'clamp(38px, 5.4vw, 68px)', lineHeight: 1, letterSpacing: '-0.045em', textWrap: 'balance' }}
              >
                Make your GitHub look like someone worth hiring.
              </h1>
              <p className="mt-5 max-w-[34rem] text-[17px] leading-[1.6] sm:text-[18px]" style={{ color: MUTED }}>
                For tech roles, recruiters open your GitHub before they call you. Enter your username and the role you want to see what they see.
              </p>
              <ul className="mt-10 grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
                {FEATURES.map(({ Icon, title, copy }) => (
                  <li key={title} className="flex gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-[14px]" style={{ background: TOOL.tint, color: TOOL.deep }}>
                      <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                    </span>
                    <span>
                      <span className="block text-[15.5px] font-medium" style={{ color: INK }}>{title}</span>
                      <span className="mt-0.5 block text-[14px] leading-[1.5]" style={{ color: MUTED }}>{copy}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <Stage tool="portfolio" className="lg:p-8">
              {usageLoading ? (
                <FormSkeleton />
              ) : usage && !canUse ? (
                <LockedState />
              ) : loading ? (
                <div className="flex justify-center py-4">
                  <ProgressSteps
                    tool="portfolio"
                    title={`Reviewing @${githubUsername.trim()}`}
                    steps={['Finding your GitHub profile', 'Reading your top repos', 'Checking READMEs and commits', `Matching skills to ${targetRole}`, 'Writing your 5-step plan']}
                    expected={25}
                  />
                </div>
              ) : (
                <Surface className="p-5 sm:p-7">
                  <p className="text-[18px] font-medium" style={{ color: INK, letterSpacing: '-0.02em' }}>Review my portfolio</p>
                  <p className="mt-1 text-[14px]" style={{ color: MUTED }}>Takes about 25 seconds. Public repos only.</p>
                  <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="github-username" className="text-[14px] font-medium text-[#0D0F0E]">
                        GitHub username
                      </Label>
                      <div className="relative">
                        <FieldIcon Icon={Github} />
                        <Input
                          id="github-username"
                          type="text"
                          value={githubUsername}
                          onChange={(e) => setGithubUsername(e.target.value.replace(/^@+/, ''))}
                          placeholder="ritvikjaiswal02"
                          autoComplete="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          required
                          className={fieldClass}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="portfolio-url" className="flex w-full items-baseline justify-between text-[14px] font-medium text-[#0D0F0E]">
                        Portfolio website
                        <span className="text-[13px] font-normal" style={{ color: MUTED }}>
                          Optional
                        </span>
                      </Label>
                      <div className="relative">
                        <FieldIcon Icon={Globe} />
                        <Input
                          id="portfolio-url"
                          type="url"
                          value={portfolioUrl}
                          onChange={(e) => setPortfolioUrl(e.target.value)}
                          placeholder="https://yourportfolio.com"
                          className={fieldClass}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="target-role" className="text-[14px] font-medium text-[#0D0F0E]">
                        Target role
                      </Label>
                      <div className="relative">
                        <FieldIcon Icon={Target} />
                        <select
                          id="target-role"
                          value={targetRole}
                          onChange={(e) => setTargetRole(e.target.value)}
                          className={`${fieldClass} cursor-pointer appearance-none pr-10`}
                        >
                          {TARGET_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          aria-hidden
                          className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2"
                          strokeWidth={1.75}
                          style={{ color: MUTED }}
                        />
                      </div>
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-[12px] border px-4 py-3 text-[14px] leading-[1.5]"
                        style={{ background: '#FEF3F2', borderColor: '#FECDCA', color: '#B42318' }}
                      >
                        <CircleAlert aria-hidden className="mt-[3px] size-4 shrink-0" strokeWidth={2} />
                        {error}
                      </div>
                    )}

                    <PrimaryButton type="submit" disabled={loading} className="h-12 w-full gap-2">
                      <Sparkles aria-hidden className="size-4" />
                      Review my portfolio
                    </PrimaryButton>
                    {!isPro && (
                      <p className="text-center text-[13.5px]" style={{ color: TOOL.deep }}>
                        {freeLeft} free {freeLeft === 1 ? 'review' : 'reviews'} left. No card needed.
                      </p>
                    )}
                  </form>
                </Surface>
              )}
            </Stage>
          </div>
        ) : (
          <div className="anim-fade-up">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 max-w-[720px]">
                <ToolTag tool="portfolio" />
                <h1
                  className="mt-4 break-words font-medium"
                  style={{ color: INK, fontSize: 'clamp(30px, 4.5vw, 48px)', lineHeight: 1.04, letterSpacing: '-0.04em' }}
                >
                  @{githubUsername}
                </h1>
                <ReportMeta portfolioUrl={portfolioUrl.trim()} targetRole={targetRole} />
              </div>
              <SecondaryButton onClick={resetAnalysis} className="h-10 gap-1.5 self-start px-4 text-[14px] sm:self-auto">
                <Pencil aria-hidden className="size-4" />
                Edit and re-run
              </SecondaryButton>
            </div>

            <div className="mt-8">
              <PortfolioResults result={result} githubUsername={githubUsername} targetRole={targetRole} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
