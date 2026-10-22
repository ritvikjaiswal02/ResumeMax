'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, CircleAlert, Github, Globe, Lock, Target } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { analyzePortfolio, getUsage } from '@/lib/api'
import { TARGET_ROLES } from '@/lib/constants'
import PortfolioResults from '@/components/PortfolioResults'
import AppNav from '@/components/landing/AppNav'
import { PrimaryButton, SecondaryButton, Stage, Surface, ToolTag } from '@/components/landing/primitives'
import { INK, LINE, MIST, MUTED, TEXT, TOOLS } from '@/components/landing/tokens'
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

function LoadingState({ message }) {
  return (
    <Surface className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center sm:py-20" role="status">
      <svg className="spin size-9" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke={TOOL.tint} strokeWidth="3" />
        <circle cx="12" cy="12" r="9" stroke={TOOL.strong} strokeWidth="3" strokeDasharray="14 42" strokeLinecap="round" />
      </svg>
      <p className="text-[14.5px]" style={{ color: TEXT }}>
        {message}
      </p>
    </Surface>
  )
}

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
        Portfolio review is part of Pro
      </h2>
      <p className="mx-auto mt-2 max-w-[400px] text-[15px] leading-[1.6]" style={{ color: MUTED }}>
        Upgrade to get a GitHub profile review, repo-by-repo fixes and a plan matched to the role you want.
      </p>
      <PrimaryButton href="/pricing" className="mt-6">
        See Pro plans
      </PrimaryButton>
    </Surface>
  )
}

function ReportInputs({ githubUsername, portfolioUrl, targetRole, onEdit }) {
  const items = [
    { label: 'GitHub username', value: githubUsername, Icon: Github },
    { label: 'Portfolio site', hint: 'Optional', value: portfolioUrl || 'Not added', empty: !portfolioUrl, Icon: Globe },
    { label: 'Target role', value: targetRole, Icon: Target },
  ]

  return (
    <Surface className="p-2.5 sm:p-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
        <dl className="grid min-w-0 flex-1 gap-2 md:grid-cols-3">
          {items.map(({ label, hint, value, empty, Icon }) => (
            <div
              key={label}
              className="min-w-0 rounded-[12px] border px-3.5 pb-2.5 pt-2"
              style={{ background: MIST, borderColor: LINE }}
            >
              <dt className="flex items-center justify-between gap-3 text-[12.5px] leading-5" style={{ color: MUTED }}>
                {label}
                {hint && <span>{hint}</span>}
              </dt>
              <dd className="mt-1 flex min-w-0 items-center gap-2 text-[15px] leading-6" style={{ color: empty ? MUTED : INK }}>
                <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.75} style={{ color: TEXT }} />
                <span className="truncate">{value}</span>
              </dd>
            </div>
          ))}
        </dl>
        <SecondaryButton onClick={onEdit} className="h-11 shrink-0 md:h-auto md:self-stretch md:rounded-[12px]">
          Edit details
        </SecondaryButton>
      </div>
    </Surface>
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

  async function handleSubmit(event) {
    event.preventDefault()
    if (!session?.access_token || !isPro) return

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
    } catch (err) {
      const message = normalizeError(err)
      if ((err?.error || err?.message) === 'pro_required') {
        setUsage((current) => ({ ...(current || {}), plan: 'free' }))
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

      <main className="mx-auto max-w-[1080px] px-4 pb-20 pt-10 sm:px-8 sm:pt-14">
        {!result ? (
          <div className="mx-auto max-w-[760px]">
            <div className="max-w-[600px]">
              <ToolTag tool="portfolio" />
              <h1
                className="mt-4 font-medium"
                style={{ color: INK, fontSize: 'clamp(30px, 5vw, 44px)', lineHeight: 1.06, letterSpacing: '-0.035em' }}
              >
                Review your GitHub and portfolio
              </h1>
              <p className="mt-4 text-[16px] leading-[1.6] sm:text-[17px]" style={{ color: MUTED }}>
                Enter your username and the role you want. You’ll get a score, repo-by-repo fixes and a 5-step plan for what to change first.
              </p>
            </div>

            <Stage tool="portfolio" className="mt-8 sm:mt-10">
              {usageLoading ? (
                <LoadingState message="Loading your account..." />
              ) : usage && !isPro ? (
                <LockedState />
              ) : loading ? (
                <LoadingState message="Fetching your GitHub data and reviewing your projects..." />
              ) : (
                <Surface className="p-5 sm:p-7">
                  <form className="space-y-5" onSubmit={handleSubmit}>
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

                    <PrimaryButton type="submit" disabled={loading} className="h-12 w-full">
                      {loading ? 'Reviewing...' : 'Review my portfolio'}
                    </PrimaryButton>
                  </form>
                </Surface>
              )}
            </Stage>
          </div>
        ) : (
          <div className="anim-fade-up">
            <div className="max-w-[640px]">
              <ToolTag tool="portfolio" />
              <h1
                className="mt-4 break-words font-medium"
                style={{ color: INK, fontSize: 'clamp(28px, 4.5vw, 40px)', lineHeight: 1.08, letterSpacing: '-0.035em' }}
              >
                Portfolio review for @{githubUsername}
              </h1>
            </div>

            <Stage tool="portfolio" className="mt-8">
              <div className="flex flex-col gap-3 sm:gap-4">
                <ReportInputs
                  githubUsername={githubUsername}
                  portfolioUrl={portfolioUrl.trim()}
                  targetRole={targetRole}
                  onEdit={resetAnalysis}
                />
                <PortfolioResults
                  result={result}
                  githubUsername={githubUsername}
                  targetRole={targetRole}
                />
              </div>
            </Stage>
          </div>
        )}
      </main>
    </div>
  )
}
