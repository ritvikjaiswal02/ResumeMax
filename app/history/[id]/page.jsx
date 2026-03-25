'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import AnalysisResults from '@/components/AnalysisResults'
import { Button } from '@/components/ui/button'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function AnalysisDetailPage() {
  const { id } = useParams()
  const router  = useRouter()
  const { user, session, loading: authLoading } = useAuth()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

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

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* Navbar */}
      <nav className="no-print sticky top-0 z-10 border-b border-border/60"
        style={{ background: 'rgba(13,13,17,0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <span className="font-display text-xl font-bold tracking-tight">Resume<span style={{ color: 'var(--gold)' }}>Lens</span></span>
            </Link>
            <Link href="/history"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              ← History
            </Link>
          </div>
          {user && (
            <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-[200px]">
              {user.email}
            </span>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-32">
            <svg className="spin w-8 h-8" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--gold)' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
              <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {/* Not found */}
        {notFound && (
          <div className="text-center py-32 anim-fade-in">
            <p className="text-muted-foreground mb-6">Analysis not found.</p>
            <Button variant="outline" asChild>
              <Link href="/history">← Back to History</Link>
            </Button>
          </div>
        )}

        {/* Result */}
        {analysis && (
          <div className="anim-fade-up">
            {/* Meta row */}
            <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-border/50">
              <div>
                <p className="text-[0.7rem] font-bold tracking-[0.14em] uppercase mb-1.5" style={{ color: 'var(--gold)' }}>
                  Analysis
                </p>
                <h1 className="font-display font-bold text-xl tracking-tight">
                  {analysis.job_title || analysis.resume_name}
                </h1>
                {analysis.job_title && (
                  <p className="text-xs text-muted-foreground/50 mt-0.5">{analysis.resume_name}</p>
                )}
                <p className="text-sm text-muted-foreground mt-0.5">
                  Analyzed on {formatDate(analysis.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
                <Button variant="outline" asChild size="sm" className="text-muted-foreground">
                  <Link href="/history">← History</Link>
                </Button>
                <Button variant="outline" asChild size="sm" className="font-medium"
                  style={{ borderColor: 'rgba(233,185,76,0.3)', color: 'var(--gold)' }}>
                  <Link href={`/analyze?reanalyze=${analysis.id}`}>Re-analyze this role ↗</Link>
                </Button>
                <Button asChild size="sm" className="font-bold"
                  style={{ background: 'var(--gold)', color: '#0d0d11' }}>
                  <Link href="/analyze">New Analysis →</Link>
                </Button>
              </div>
            </div>

            <AnalysisResults result={analysis.result} />
          </div>
        )}
      </main>
    </div>
  )
}
