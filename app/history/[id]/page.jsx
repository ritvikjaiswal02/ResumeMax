'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Plus, RotateCcw, SearchX } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import AnalysisResults from '@/components/AnalysisResults'
import PortfolioResults from '@/components/PortfolioResults'
import AppNav from '@/components/landing/AppNav'
import { Surface, PrimaryButton, SecondaryButton } from '@/components/landing/primitives'
import { DANGER, INK, MIST, MUTED, SUCCESS, TOOLS, WARNING } from '@/components/landing/tokens'
import { getUsage } from '@/lib/api'

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

export default function AnalysisDetailPage() {
  const { id } = useParams()
  const router  = useRouter()
  const { user, session, loading: authLoading, signOut } = useAuth()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [usage, setUsage]       = useState(null)

  useEffect(() => {
    if (!session?.access_token) return
    getUsage(session.access_token).then(u => { if (u) setUsage(u) })
  }, [session])

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/analyze'); return }
    if (!session) return

    fetch(`/api/history/${id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then((data) => {
        if (!data) return
        setAnalysis(data.analysis)
        setLoading(false)
      })
      .catch(() => {
        setNotFound(true)
        setLoading(false)
      })
  }, [id, session, user, authLoading, router])

  const isPortfolio = analysis?.type === 'portfolio'
  const tool = isPortfolio ? TOOLS.portfolio : TOOLS.resume
  const score = typeof analysis?.score === 'number' ? analysis.score : null

  return (
    <div className="rmx min-h-screen" style={{ background: MIST }}>
      <div className="no-print">
        <AppNav active="history" user={user} usage={usage} onSignOut={signOut} loading={authLoading} />
      </div>

      <main className="mx-auto max-w-[1080px] px-4 py-8 sm:px-8 sm:py-12">

        <Link href="/history"
          className="no-print mb-6 inline-flex items-center gap-1.5 rounded-full text-[14px] font-medium transition-colors hover:text-[#0D0F0E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D0F0E]"
          style={{ color: MUTED }}>
          <ArrowLeft className="size-4" aria-hidden /> Back to history
        </Link>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-32" role="status" aria-label="Loading analysis">
            <Loader2 className="size-7 animate-spin" style={{ color: MUTED }} aria-hidden />
          </div>
        )}

        {/* Not found */}
        {notFound && (
          <Surface className="px-6 py-14 text-center sm:py-20">
            <div className="mx-auto mb-5 grid size-12 place-items-center rounded-full" style={{ background: MIST, color: MUTED }}>
              <SearchX className="size-5" aria-hidden />
            </div>
            <h1 className="text-[20px] font-medium tracking-[-0.02em]" style={{ color: INK }}>
              We couldn&apos;t find this check
            </h1>
            <p className="mx-auto mt-2 max-w-[380px] text-[15px] leading-[1.6]" style={{ color: MUTED }}>
              It may have been removed, or the link is wrong. Your other checks are still in your history.
            </p>
            <SecondaryButton href="/history" className="mt-7">
              <ArrowLeft className="size-4" aria-hidden /> Back to history
            </SecondaryButton>
          </Surface>
        )}

        {/* Result */}
        {analysis && (
          <div>
            {/* Header */}
            <Surface className="no-print mb-8 p-5 sm:p-7">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  {score !== null && (
                    <span
                      className="inline-flex h-12 min-w-[60px] shrink-0 items-center justify-center rounded-full px-3 text-[20px] font-semibold tabular-nums"
                      style={{ background: alpha(band(score).color, 0.14), color: band(score).ink }}>
                      <span className="sr-only">Score </span>
                      {score}
                    </span>
                  )}
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium"
                      style={{ background: tool.tint, color: tool.deep }}>
                      <span aria-hidden className="size-1.5 rounded-full" style={{ background: tool.strong }} />
                      {isPortfolio ? 'Portfolio review' : 'Resume check'}
                    </span>
                    <h1 className="mt-2 break-words font-medium"
                      style={{ color: INK, fontSize: 'clamp(22px, 3vw, 30px)', lineHeight: 1.15, letterSpacing: '-0.03em' }}>
                      {isPortfolio
                        ? analysis.resume_name
                        : (analysis.job_title || analysis.resume_name)}
                    </h1>
                    {isPortfolio ? (
                      analysis.jd_snippet && <p className="mt-1 break-words text-[14px]" style={{ color: MUTED }}>{analysis.jd_snippet}</p>
                    ) : analysis.job_title && (
                      <p className="mt-1 break-words text-[14px]" style={{ color: MUTED }}>{analysis.resume_name}</p>
                    )}
                    <p className="mt-1 text-[14px]" style={{ color: MUTED }}>
                      Checked on <time dateTime={analysis.created_at}>{formatDate(analysis.created_at)}</time>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 md:shrink-0">
                  <SecondaryButton href={isPortfolio ? '/portfolio' : `/analyze?reanalyze=${analysis.id}`} className="h-10 px-4 text-[14px]">
                    <RotateCcw className="size-4" aria-hidden />
                    {isPortfolio ? 'Review again' : 'Re-analyze this role'}
                  </SecondaryButton>
                  <PrimaryButton href={isPortfolio ? '/portfolio' : '/analyze'} className="h-10 px-4 text-[14px]">
                    <Plus className="size-4" aria-hidden />
                    {isPortfolio ? 'New review' : 'New check'}
                  </PrimaryButton>
                </div>
              </div>
            </Surface>

            {isPortfolio ? (
              <PortfolioResults
                result={analysis.result}
                githubUsername={analysis.resume_name}
                targetRole={analysis.jd_snippet?.split(' | ')[0]}
              />
            ) : (
              <AnalysisResults result={analysis.result} />
            )}
          </div>
        )}
      </main>
    </div>
  )
}
