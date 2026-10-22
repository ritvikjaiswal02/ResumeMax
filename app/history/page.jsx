'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, ChevronRight, FileText, History as HistoryIcon, Plus, RotateCcw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import AppNav from '@/components/landing/AppNav'
import { Surface, PrimaryButton } from '@/components/landing/primitives'
import { DANGER, INK, MIST, MUTED, SUCCESS, TEXT, TOOLS, WARNING } from '@/components/landing/tokens'

const truncate = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : str

// Darker status shades for small text on tinted pills (AA contrast).
const INK_SUCCESS = '#067647'
const INK_WARNING = '#B54708'
const INK_DANGER = '#B42318'

function alpha(hex, a) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

function band(score) {
  if (score >= 75) return { color: SUCCESS, ink: INK_SUCCESS }
  if (score >= 55) return { color: WARNING, ink: INK_WARNING }
  return { color: DANGER, ink: INK_DANGER }
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function relativeDate(iso) {
  const d = new Date(iso)
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((startOf(new Date()) - startOf(d)) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return formatDate(iso)
}

/* ── Score pill ───────────────────────────────────────────── */
function ScorePill({ score, large }) {
  const b = band(score)
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold tabular-nums ${large ? 'h-10 min-w-[52px] px-3 text-[16px]' : 'h-8 min-w-[44px] px-2.5 text-[14px]'}`}
      style={{ background: alpha(b.color, 0.14), color: b.ink }}
    >
      <span className="sr-only">Score </span>
      {score}
    </span>
  )
}

/* ── Delta ────────────────────────────────────────────────── */
function DeltaPill({ delta }) {
  if (delta === null) return null
  if (delta === 0) return (
    <span className="text-[13px] tabular-nums whitespace-nowrap" style={{ color: MUTED }}>No change</span>
  )
  const up = delta > 0
  const Icon = up ? ArrowUp : ArrowDown
  return (
    <span className="inline-flex items-center gap-0.5 text-[13px] font-medium tabular-nums whitespace-nowrap"
      style={{ color: up ? INK_SUCCESS : INK_DANGER }}>
      <Icon className="size-3.5" aria-hidden />
      <span className="sr-only">{up ? 'Up' : 'Down'} </span>
      {Math.abs(delta)} pts
    </span>
  )
}

/* ── Verdict ──────────────────────────────────────────────── */
function VerdictLabel({ verdict }) {
  const map = {
    strong:     { label: 'Strong',     color: INK_SUCCESS },
    decent:     { label: 'Decent',     color: INK_WARNING },
    good:       { label: 'Good',       color: INK_WARNING },
    needs_work: { label: 'Needs work', color: INK_DANGER },
    poor:       { label: 'Poor',       color: INK_DANGER },
  }
  const c = map[verdict] ?? { label: verdict ?? '', color: MUTED }
  if (!c.label) return null
  return <span className="font-medium" style={{ color: c.color }}>{c.label}</span>
}

function TypeBadge({ type }) {
  const t = type === 'portfolio' ? TOOLS.portfolio : TOOLS.resume
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium"
      style={{ background: t.tint, color: t.deep }}>
      <span aria-hidden className="size-1.5 rounded-full" style={{ background: t.strong }} />
      {type === 'portfolio' ? 'Portfolio' : 'Resume'}
    </span>
  )
}

/* ── Progression summary ──────────────────────────────────── */
function ProgressionBanner({ analyses }) {
  const chron  = [...analyses].reverse()   // oldest first
  const scores = chron.map(a => a.score)
  if (scores.length < 2) return null

  const latest       = scores[scores.length - 1]
  const best         = Math.max(...scores)
  const overallDelta = scores[scores.length - 1] - scores[0]
  const isUp         = overallDelta > 0
  const isDown       = overallDelta < 0
  const bars         = chron.slice(-20)

  return (
    <Surface className="mb-6 p-5 sm:p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <dl className="grid grid-cols-3 gap-4 sm:gap-8">
          <div>
            <dt className="text-[13px]" style={{ color: MUTED }}>Latest</dt>
            <dd className="mt-1 text-[28px] font-semibold leading-none tabular-nums tracking-[-0.02em]" style={{ color: band(latest).ink }}>{latest}</dd>
          </div>
          <div>
            <dt className="text-[13px]" style={{ color: MUTED }}>Best</dt>
            <dd className="mt-1 text-[28px] font-semibold leading-none tabular-nums tracking-[-0.02em]" style={{ color: INK }}>{best}</dd>
          </div>
          <div>
            <dt className="text-[13px]" style={{ color: MUTED }}>Change</dt>
            <dd className="mt-1 text-[28px] font-semibold leading-none tabular-nums tracking-[-0.02em]"
              style={{ color: isUp ? INK_SUCCESS : isDown ? INK_DANGER : MUTED }}>
              {isUp ? '+' : ''}{overallDelta}
            </dd>
          </div>
        </dl>

        <div className="flex h-14 w-full items-end gap-1 sm:w-auto" aria-label="Score history, oldest to newest" role="list">
          {bars.map((a, i) => {
            const isLatest = i === bars.length - 1
            return (
              <Link key={a.id} href={`/history/${a.id}`} role="listitem"
                aria-label={`Score ${a.score} on ${formatDate(a.created_at)}`}
                title={`${a.score} on ${formatDate(a.created_at)}`}
                className="flex h-full min-w-[6px] max-w-[14px] flex-1 items-end rounded-[4px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D0F0E] sm:w-3.5 sm:flex-none">
                <span className="block w-full rounded-[4px] transition-opacity hover:opacity-70"
                  style={{
                    height: `${Math.max(8, a.score)}%`,
                    background: isLatest ? band(a.score).color : alpha(band(a.score).color, 0.4),
                  }} />
              </Link>
            )
          })}
        </div>
      </div>
    </Surface>
  )
}

/* ── Skeleton ─────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-start gap-4 px-5 py-5 sm:px-6">
      <div className="h-8 w-11 shrink-0 rounded-full" style={{ background: MIST }} />
      <div className="flex-1 space-y-2.5">
        <div className="h-3.5 w-2/3 max-w-[260px] rounded-full" style={{ background: '#ECEFEA' }} />
        <div className="h-3 w-1/3 max-w-[160px] rounded-full" style={{ background: MIST }} />
      </div>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────── */
export default function HistoryPage() {
  const router = useRouter()
  const { user, session, loading: authLoading, signOut } = useAuth()
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/analyze'); return }
    if (!session) return

    fetch('/api/history', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(data => { setAnalyses(data.analyses || []); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [session, user, authLoading, router])

  // Delta: newest-first list — row[i] vs row[i+1] (previous chronologically)
  const getDelta = (i) => {
    if (i >= analyses.length - 1) return null
    return analyses[i].score - analyses[i + 1].score
  }

  function handleReanalyze(a, e) {
    e.preventDefault()
    e.stopPropagation()
    if (a.type === 'portfolio') {
      router.push('/portfolio')
      return
    }
    const jd = a.jd_text || a.jd_snippet || ''
    if (jd) sessionStorage.setItem('rl_prefill_jd', jd)
    router.push('/analyze')
  }

  return (
    <div className="rmx min-h-screen" style={{ background: MIST }}>
      <AppNav active="history" user={user} onSignOut={signOut} loading={authLoading} />

      <main className="mx-auto max-w-[880px] px-4 py-10 sm:px-8 sm:py-14">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-medium"
              style={{ color: INK, fontSize: 'clamp(30px, 4vw, 40px)', lineHeight: 1.08, letterSpacing: '-0.035em' }}>
              History
            </h1>
            <p className="mt-2 text-[16px] leading-[1.6]" style={{ color: MUTED }}>
              Every check you run is saved here, so you can reopen it or run it again.
            </p>
          </div>
          {!loading && !error && analyses.length > 0 && (
            <PrimaryButton href="/analyze" className="self-start sm:self-auto">
              <Plus className="size-4" aria-hidden /> New check
            </PrimaryButton>
          )}
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="mb-8 rounded-[14px] border px-4 py-3 text-[14px]"
            style={{ background: '#FEF3F2', borderColor: '#FECDCA', color: INK_DANGER }}>
            We couldn&apos;t load your history. Please refresh the page.
          </div>
        )}

        {/* Loading */}
        {loading && !error && (
          <Surface className="overflow-hidden" aria-busy="true" aria-label="Loading history">
            <div className="divide-y divide-[#E3E6E1]">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          </Surface>
        )}

        {/* Empty */}
        {!loading && !error && analyses.length === 0 && (
          <Surface className="px-6 py-14 text-center sm:py-20">
            <div className="mx-auto mb-5 grid size-12 place-items-center rounded-full"
              style={{ background: TOOLS.resume.tint, color: TOOLS.resume.deep }}>
              <HistoryIcon className="size-5" aria-hidden />
            </div>
            <h2 className="text-[20px] font-medium tracking-[-0.02em]" style={{ color: INK }}>
              No checks yet
            </h2>
            <p className="mx-auto mt-2 max-w-[400px] text-[15px] leading-[1.6]" style={{ color: MUTED }}>
              When you check your resume against a job, the score and feedback land here. Come back any time to see how you&apos;ve improved or to re-run a role.
            </p>
            <PrimaryButton href="/analyze" className="mt-7">
              <FileText className="size-4" aria-hidden /> Check my resume
            </PrimaryButton>
          </Surface>
        )}

        {/* Content */}
        {!loading && !error && analyses.length > 0 && (
          <>
            {analyses.length >= 2 && <ProgressionBanner analyses={analyses} />}

            <Surface className="overflow-hidden">
              <ul className="divide-y divide-[#E3E6E1]">
                {analyses.map((a, i) => {
                  const delta   = getDelta(i)
                  const isFirst = i === 0
                  const isPortfolio = a.type === 'portfolio'
                  const title = isPortfolio ? a.resume_name : (a.job_title || a.resume_name)
                  const subtitle = isPortfolio ? a.jd_snippet : (a.job_title ? a.resume_name : null)

                  return (
                    <li key={a.id}
                      className="group relative flex items-start gap-3 px-4 py-4 transition-colors hover:bg-[#F8F9F7] sm:gap-4 sm:px-6 sm:py-5">
                      <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
                        <ScorePill score={a.score} />
                        <DeltaPill delta={delta} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link href={`/history/${a.id}`}
                            className="min-w-0 text-[15px] font-medium leading-snug outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-[18px] focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-[#0D0F0E] sm:text-[16px]"
                            style={{ color: INK }}>
                            <span className="break-words">{truncate(title, 72)}</span>
                          </Link>
                          <TypeBadge type={a.type} />
                          {isFirst && (
                            <span className="rounded-full px-2 py-0.5 text-[12px] font-medium" style={{ background: '#F1F3EF', color: TEXT }}>
                              Latest
                            </span>
                          )}
                        </div>

                        {subtitle && (
                          <p className="mt-0.5 truncate text-[14px]" style={{ color: MUTED }}>
                            {subtitle}
                          </p>
                        )}

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]" style={{ color: MUTED }}>
                          <time dateTime={a.created_at} title={formatDate(a.created_at)}>{relativeDate(a.created_at)}</time>
                          {a.verdict && <span aria-hidden>·</span>}
                          <VerdictLabel verdict={a.verdict} />
                        </div>

                        <button
                          type="button"
                          onClick={e => handleReanalyze(a, e)}
                          className="relative z-10 mt-2.5 inline-flex items-center gap-1.5 rounded-full text-[13px] font-medium hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D0F0E]"
                          style={{ color: isPortfolio ? TOOLS.portfolio.deep : TOOLS.resume.deep }}>
                          <RotateCcw className="size-3.5" aria-hidden />
                          {isPortfolio ? 'Review again' : 'Re-analyze this role'}
                        </button>
                      </div>

                      <ChevronRight aria-hidden
                        className="mt-1.5 size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                        style={{ color: '#A3A9A5' }} />
                    </li>
                  )
                })}
              </ul>
            </Surface>
          </>
        )}
      </main>
    </div>
  )
}
