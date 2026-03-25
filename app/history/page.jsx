'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

const truncate = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : str

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

/* ── Score ring ───────────────────────────────────────────── */
function ScoreRing({ score }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--gold)' : 'var(--danger)'
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
      <circle cx="26" cy="26" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="3" />
      <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 26 26)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x="26" y="31" textAnchor="middle" fontSize="12" fontWeight="700"
        fill="var(--foreground)" fontFamily="var(--font-display, Georgia), serif">
        {score}
      </text>
    </svg>
  )
}

/* ── Delta pill ───────────────────────────────────────────── */
function DeltaPill({ delta }) {
  if (delta === null) return null
  if (delta === 0) return (
    <span className="text-[0.67rem] font-semibold tabular-nums whitespace-nowrap"
      style={{ color: 'rgba(255,255,255,0.22)' }}>→ 0 pts</span>
  )
  const up = delta > 0
  return (
    <span className="text-[0.67rem] font-bold tabular-nums whitespace-nowrap"
      style={{ color: up ? 'var(--success)' : 'var(--danger)' }}>
      {up ? '↑' : '↓'} {up ? '+' : ''}{delta} pts
    </span>
  )
}

/* ── Verdict badge ────────────────────────────────────────── */
function VerdictBadge({ verdict }) {
  const map = {
    strong:     { label: 'Strong',     bg: 'rgba(74,222,128,0.1)',   color: 'var(--success)', border: 'rgba(74,222,128,0.22)' },
    good:       { label: 'Good',       bg: 'rgba(233,185,76,0.1)',   color: 'var(--gold)',    border: 'rgba(233,185,76,0.22)' },
    needs_work: { label: 'Needs Work', bg: 'rgba(248,113,113,0.08)', color: 'var(--danger)',  border: 'rgba(248,113,113,0.22)' },
    poor:       { label: 'Poor',       bg: 'rgba(248,113,113,0.08)', color: 'var(--danger)',  border: 'rgba(248,113,113,0.22)' },
  }
  const c = map[verdict] ?? { label: verdict ?? '', bg: 'transparent', color: 'var(--dim)', border: 'var(--border)' }
  return (
    <span className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full border"
      style={{ background: c.bg, color: c.color, borderColor: c.border }}>
      {c.label}
    </span>
  )
}

/* ── Progression banner ───────────────────────────────────── */
function ProgressionBanner({ analyses }) {
  const chron  = [...analyses].reverse()   // oldest → newest
  const scores = chron.map(a => a.score)
  if (scores.length < 2) return null

  const best         = Math.max(...scores)
  const overallDelta = scores[scores.length - 1] - scores[0]
  const isUp         = overallDelta > 0
  const isDown       = overallDelta < 0

  return (
    <div className="mb-10 rounded-2xl border anim-fade-up overflow-hidden"
      style={{ background: 'var(--surface)', borderColor: 'rgba(255,255,255,0.07)' }}>

      {/* Top strip */}
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-[0.65rem] font-bold tracking-[0.14em] uppercase mb-4"
          style={{ color: 'var(--dim)' }}>
          Score History
        </p>

        {/* Score chain */}
        <div className="flex items-baseline gap-2 flex-wrap">
          {chron.map((a, i) => {
            const isLatest = i === chron.length - 1
            const scoreColor =
              isLatest       ? 'var(--gold)'    :
              a.score >= 70  ? 'var(--success)' :
              a.score >= 40  ? 'var(--gold)'    : 'var(--danger)'

            return (
              <div key={a.id} className="flex items-baseline gap-2">
                <Link href={`/history/${a.id}`}
                  onClick={e => e.stopPropagation()}
                  className="tabular-nums font-black leading-none transition-opacity hover:opacity-70"
                  style={{
                    color:      scoreColor,
                    fontSize:   isLatest ? '2.25rem' : '1.75rem',
                    textShadow: isLatest ? '0 0 28px rgba(233,185,76,0.45)' : 'none',
                    letterSpacing: '-0.03em',
                  }}>
                  {a.score}
                </Link>

                {i < chron.length - 1 && (
                  <span className="text-xl font-light select-none"
                    style={{ color: 'rgba(255,255,255,0.18)' }}>→</span>
                )}
              </div>
            )
          })}

          {/* Latest label inline */}
          <span className="text-[0.6rem] font-bold tracking-wider uppercase self-end mb-1.5 ml-1 px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(233,185,76,0.12)', color: 'var(--gold)' }}>
            latest
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-6 py-3.5 flex items-center gap-8">
        <div className="flex items-baseline gap-2">
          <span className="text-[0.65rem] font-medium" style={{ color: 'var(--dim)' }}>Best Score</span>
          <span className="text-base font-black tabular-nums" style={{ color: 'var(--success)' }}>{best}</span>
        </div>
        <div className="w-px h-4 self-center" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="flex items-baseline gap-2">
          <span className="text-[0.65rem] font-medium" style={{ color: 'var(--dim)' }}>Overall Change</span>
          <span className="text-base font-black tabular-nums"
            style={{ color: isUp ? 'var(--success)' : isDown ? 'var(--danger)' : 'var(--dim)' }}>
            {isUp ? '+' : ''}{overallDelta}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Skeleton ─────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl p-5 border"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'var(--card)' }}>
      <div className="flex items-center gap-4">
        <div className="rounded-full shrink-0" style={{ background: 'var(--surface-3)', width: 52, height: 52 }} />
        <div className="flex-1 space-y-2.5">
          <div className="h-3.5 rounded w-44" style={{ background: 'var(--surface-3)' }} />
          <div className="h-2.5 rounded w-28" style={{ background: 'var(--surface-2)' }} />
          <div className="h-2.5 rounded w-20" style={{ background: 'var(--surface-2)' }} />
        </div>
      </div>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────── */
export default function HistoryPage() {
  const router = useRouter()
  const { user, session, loading: authLoading } = useAuth()
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

  // Delta: newest-first list — card[i] vs card[i+1] (previous chronologically)
  const getDelta = (i) => {
    if (i >= analyses.length - 1) return null
    return analyses[i].score - analyses[i + 1].score
  }

  function handleReanalyze(a, e) {
    e.preventDefault()
    e.stopPropagation()
    const jd = a.jd_text || a.jd_snippet || ''
    if (jd) sessionStorage.setItem('rl_prefill_jd', jd)
    router.push('/analyze')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* Navbar */}
      <nav className="sticky top-0 z-10 border-b"
        style={{ background: 'rgba(13,13,17,0.88)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-7">
            <Link href="/">
              <span className="font-display text-xl font-bold tracking-tight">Resume<span style={{ color: 'var(--gold)' }}>Lens</span></span>
            </Link>
            <Link href="/analyze"
              className="text-sm font-medium transition-colors hidden sm:block"
              style={{ color: 'var(--dim)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--foreground)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--dim)'}>
              Analyze
            </Link>
          </div>
          {user && (
            <span className="text-xs hidden sm:block truncate max-w-[200px]"
              style={{ color: 'var(--dim)' }}>
              {user.email}
            </span>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-14">

        {/* Header */}
        <div className="mb-10 anim-fade-up">
          <p className="text-[0.68rem] font-bold tracking-[0.16em] uppercase mb-3"
            style={{ color: 'var(--gold)' }}>
            History
          </p>
          <h1 className="font-display font-black"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-0.035em', lineHeight: 1.05 }}>
            Your past analyses
          </h1>
          <p className="text-sm mt-3" style={{ color: 'var(--dim)' }}>
            Track how your resume has improved over time.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl text-sm border mb-8"
            style={{ background: 'rgba(248,113,113,0.07)', borderColor: 'rgba(248,113,113,0.2)', color: 'var(--danger)' }}>
            Failed to load history. Please refresh.
          </div>
        )}

        {/* Loading */}
        {loading && !error && (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Empty */}
        {!loading && !error && analyses.length === 0 && (
          <div className="text-center py-28 anim-fade-in">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'var(--surface-2)', color: 'var(--dim)' }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--dim)' }}>
              No analyses yet. Run your first to see history here.
            </p>
            <Button asChild className="font-bold"
              style={{ background: 'var(--gold)', color: '#0d0d11' }}>
              <Link href="/analyze">Analyze a Resume →</Link>
            </Button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && analyses.length > 0 && (
          <>
            {/* Progression banner */}
            {analyses.length >= 2 && <ProgressionBanner analyses={analyses} />}

            {/* Cards */}
            <div className="space-y-2 anim-fade-up">
              {analyses.map((a, i) => {
                const delta   = getDelta(i)
                const isFirst = i === 0
                const title   = a.job_title || a.resume_name

                return (
                  <Link key={a.id} href={`/history/${a.id}`} className="block group">
                    <div
                      className="rounded-xl border transition-all duration-200 cursor-pointer"
                      style={{
                        borderColor: isFirst ? 'rgba(233,185,76,0.38)' : 'rgba(255,255,255,0.07)',
                        background:  isFirst ? 'rgba(233,185,76,0.04)' : 'var(--card)',
                        padding: isFirst ? '1.25rem 1.375rem' : '1rem 1.25rem',
                        boxShadow: isFirst ? '0 0 0 1px rgba(233,185,76,0.1), 0 2px 16px rgba(233,185,76,0.06)' : 'none',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(233,185,76,0.45)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = isFirst ? 'rgba(233,185,76,0.38)' : 'rgba(255,255,255,0.07)' }}
                    >
                      <div className="flex items-center gap-4">

                        {/* Left: score ring + delta pill stacked */}
                        <div className="flex flex-col items-center gap-1.5 shrink-0" style={{ minWidth: 52 }}>
                          <ScoreRing score={a.score} />
                          <DeltaPill delta={delta} />
                        </div>

                        {/* Middle: content */}
                        <div className="flex-1 min-w-0">
                          {/* Title row */}
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="font-semibold text-[0.9375rem] truncate leading-snug group-hover:text-[var(--gold)] transition-colors duration-150">
                              {truncate(title, 56)}
                            </span>
                            {isFirst && (
                              <span className="text-[0.58rem] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded shrink-0"
                                style={{ background: 'rgba(233,185,76,0.12)', color: 'var(--gold)' }}>
                                Latest
                              </span>
                            )}
                          </div>

                          {/* File name subtitle if job_title present */}
                          {a.job_title && (
                            <p className="text-xs truncate mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                              {a.resume_name}
                            </p>
                          )}

                          {/* Meta row: date + verdict */}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-xs" style={{ color: 'var(--dim)' }}>
                              {formatDate(a.created_at)}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.6rem' }}>•</span>
                            <VerdictBadge verdict={a.verdict} />
                          </div>

                          {/* Re-analyze action */}
                          <button
                            onClick={e => handleReanalyze(a, e)}
                            className="mt-2 text-[0.72rem] font-medium block group/reanalyze"
                            style={{ color: 'rgba(255,255,255,0.28)', transition: 'color 0.15s ease' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}>
                            <span style={{ textDecoration: 'none', transition: 'text-decoration 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                              Re-analyze this role
                            </span>
                            <span className="inline-block ml-0.5"
                              style={{ transition: 'transform 0.18s ease' }}
                              onMouseEnter={e => e.currentTarget.style.transform = 'translate(2px, -2px)'}
                              onMouseLeave={e => e.currentTarget.style.transform = 'translate(0,0)'}>
                              ↗
                            </span>
                          </button>
                        </div>

                        {/* Chevron */}
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          className="shrink-0 transition-colors duration-150"
                          style={{ color: 'rgba(255,255,255,0.2)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Bottom CTA */}
            <div className="mt-10 pt-8 border-t text-center"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <Button asChild className="font-bold px-6"
                style={{ background: 'var(--gold)', color: '#0d0d11' }}>
                <Link href="/analyze">+ New Analysis</Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
