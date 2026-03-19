'use client'

import { useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

const JD_MAX = 3000
const FILE_MAX_BYTES = 5 * 1024 * 1024

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const stripMarkdown = (text) =>
  text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')

const truncate = (str, n) => (str.length > n ? str.slice(0, n) + '…' : str)

const severityStyle = {
  fix:  { border: 'border-l-red-500',   bg: 'bg-red-50',   badge: 'bg-red-100 text-red-700'    },
  warn: { border: 'border-l-amber-500', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
  ok:   { border: 'border-l-green-500', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700' },
}

/* ─── ScoreRing ───────────────────────────────────────────────────────── */
function ScoreRing({ score }) {
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  const verdict =
    score >= 85 ? 'Strong' : score >= 70 ? 'Good' : score >= 40 ? 'Needs Work' : 'Poor'

  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">ATS Match Score</p>
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="14" />
        <circle
          cx="100" cy="100" r={radius}
          fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 100 100)"
        />
        <text x="100" y="93" textAnchor="middle" fontSize="44" fontWeight="700" fill="#111827">{score}</text>
        <text x="100" y="117" textAnchor="middle" fontSize="14" fill="#9ca3af">/ 100</text>
      </svg>
      <span
        className="text-sm font-semibold px-4 py-1 rounded-full"
        style={{ background: color + '22', color }}
      >
        {verdict}
      </span>
    </div>
  )
}

/* ─── CopyButton ──────────────────────────────────────────────────────── */
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="shrink-0 text-xs px-3 py-1.5 rounded-md border border-gray-300 bg-white
                 hover:bg-gray-50 hover:border-gray-400 transition-colors whitespace-nowrap
                 font-medium text-gray-600"
    >
      {copied ? '✓ Copied!' : 'Copy to clipboard'}
    </button>
  )
}

/* ─── PdfUploadZone ───────────────────────────────────────────────────── */
function PdfUploadZone({ file, onFile, onClear, fileError }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (f) => {
    if (!f) return
    if (f.type !== 'application/pdf') { onFile(null, 'Only PDF files are accepted.'); return }
    if (f.size > FILE_MAX_BYTES)       { onFile(null, 'File too large. Max size is 5MB.'); return }
    onFile(f, null)
  }

  if (file) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center gap-3
                      border-2 border-green-300 bg-green-50 rounded-xl">
        <svg className="w-14 h-14 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="1.8" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12l3 3 5-5" />
        </svg>
        <div className="text-center px-4">
          <p className="text-sm font-semibold text-green-700">Ready to analyze</p>
          <p className="text-sm text-gray-600 truncate max-w-[220px] mt-0.5">{file.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
        </div>
        <button onClick={onClear} className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors">
          Remove file
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
        className={`min-h-[300px] flex flex-col items-center justify-center gap-2
          border-2 border-dashed rounded-xl cursor-pointer transition-all select-none
          ${dragging
            ? 'border-indigo-500 bg-indigo-50 scale-[1.01]'
            : 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/40'
          }`}
      >
        <svg className="w-14 h-14 text-indigo-300 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 3v5a1 1 0 001 1h5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6M9 17h4" />
        </svg>
        <p className="text-sm text-gray-600 text-center px-6 leading-relaxed">
          Drop your resume PDF here, or{' '}
          <span className="text-indigo-600 font-semibold">click to browse</span>
        </p>
        <p className="text-xs text-gray-400">PDF only · max 5MB</p>
        <input ref={inputRef} type="file" accept=".pdf" className="hidden"
          onChange={(e) => handleFile(e.target.files[0])} />
      </div>
      {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
    </div>
  )
}

/* ─── AuthModal ───────────────────────────────────────────────────────── */
function AuthModal({ onClose, signInWithGoogle, signInWithEmail }) {
  const [magicEmail, setMagicEmail]     = useState('')
  const [magicSent, setMagicSent]       = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)

  const handleMagicLink = async () => {
    if (!magicEmail.trim()) return
    setMagicLoading(true)
    await signInWithEmail(magicEmail.trim())
    setMagicSent(true)
    setMagicLoading(false)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center bg-black/50 pt-24 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative">
        <button onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          aria-label="Close">✕</button>

        <h2 className="text-xl font-bold text-gray-900 mb-1">Sign in to ResumeLens</h2>
        <p className="text-sm text-gray-500 mb-6">Get 2 free analyses per month</p>

        <button onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 border border-gray-300
                     rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50
                     transition-colors mb-5">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {magicSent ? (
          <div className="text-center py-4">
            <p className="text-sm font-medium text-gray-700">Check your email for a sign-in link</p>
            <p className="text-xs text-gray-400 mt-1">{magicEmail}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <input type="email" placeholder="you@example.com"
              value={magicEmail} onChange={(e) => setMagicEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleMagicLink()}
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent" />
            <button onClick={handleMagicLink}
              disabled={magicLoading || !magicEmail.trim()}
              className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-lg
                         hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {magicLoading ? 'Sending…' : 'Send magic link'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── PaywallModal ────────────────────────────────────────────────────── */
function PaywallModal({ onClose }) {
  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center bg-black/50 pt-24 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative text-center">
        <button onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          aria-label="Close">✕</button>
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          You&apos;ve used your 2 free analyses this month
        </h2>
        <p className="text-sm text-gray-500 mb-6">Upgrade to Pro for unlimited analyses</p>
        <button className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg
                           hover:bg-indigo-700 transition-colors text-sm mb-3">
          Upgrade to Pro — $6/month
        </button>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Come back next month
        </button>
      </div>
    </div>
  )
}

/* ─── Analyze Page ────────────────────────────────────────────────────── */
export default function AnalyzePage() {
  const topRef = useRef(null)
  const searchParams = useSearchParams()
  const authError = searchParams.get('auth_error')
  const { user, loading: authLoading, signOut, signInWithGoogle, signInWithEmail } = useAuth()

  const [resumeFile, setResumeFile]         = useState(null)
  const [fileError, setFileError]           = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading]               = useState(false)
  const [result, setResult]                 = useState(null)
  const [error, setError]                   = useState('')
  const [showAuthModal, setShowAuthModal]   = useState(false)
  const [showPaywall, setShowPaywall]       = useState(false)

  const handleFile  = (f, err) => { setResumeFile(f); setFileError(err || '') }
  const handleClear = ()        => { setResumeFile(null); setFileError('') }

  const handleReset = () => {
    setResumeFile(null); setFileError('')
    setJobDescription(''); setResult(null); setError('')
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleAnalyze = async () => {
    if (!user) { setShowAuthModal(true); return }

    setError(''); setResult(null); setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const formData = new FormData()
      formData.append('resume', resumeFile)
      formData.append('jobDescription', jobDescription)

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()

      if (res.status === 403) {
        setShowPaywall(true)
      } else if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
      } else {
        setResult(data)
      }
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canAnalyze = resumeFile !== null && jobDescription.trim().length > 0 && !loading
  const hasModal   = showAuthModal || showPaywall

  return (
    <div ref={topRef} className="min-h-screen bg-white text-gray-900" style={{ position: 'relative' }}>

      {authError && (
        <div className="fixed top-0 inset-x-0 z-50 bg-red-600 text-white text-sm text-center py-2 px-4">
          Sign-in failed — your session may have expired. Please try again.
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          signInWithGoogle={signInWithGoogle}
          signInWithEmail={signInWithEmail}
        />
      )}
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      <div className={hasModal ? 'pointer-events-none select-none' : ''}>

        {/* ── Navbar ── */}
        <nav className="border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight text-indigo-600">
              ResumeLens
            </Link>
            {authLoading ? null : user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 hidden sm:block">{truncate(user.email, 20)}</span>
                <button onClick={signOut}
                  className="text-sm font-medium text-gray-600 border border-gray-300 px-4 py-1.5
                             rounded-lg hover:border-red-300 hover:text-red-600 transition-colors">
                  Sign out
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)}
                className="text-sm font-medium text-gray-600 border border-gray-300 px-4 py-1.5
                           rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                Sign in
              </button>
            )}
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">

          {/* Hero */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
              Get hired faster. Know exactly what&apos;s missing.
            </h1>
            <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
              Upload your resume PDF and paste a job description. Get your ATS score,
              missing keywords, and AI-rewritten bullet points in seconds.
            </p>
          </div>

          {/* Upload + JD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Your Resume</label>
              <PdfUploadZone file={resumeFile} onFile={handleFile} onClear={handleClear} fileError={fileError} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">Job Description</label>
              <textarea
                className="w-full min-h-[300px] border border-gray-300 rounded-xl p-3.5 text-sm
                           resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400
                           focus:border-transparent transition-shadow"
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                maxLength={JD_MAX}
              />
              <span className="text-xs text-gray-400 text-right">{jobDescription.length} / {JD_MAX}</span>
            </div>
          </div>

          {/* Analyze Button */}
          <div className="flex justify-center mb-8">
            <button onClick={handleAnalyze} disabled={!canAnalyze}
              className="px-10 py-3 bg-indigo-600 text-white font-semibold rounded-lg
                         hover:bg-indigo-700 active:bg-indigo-800
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors text-base shadow-sm">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                            strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
                  </svg>
                  Analyzing…
                </span>
              ) : 'Analyze My Resume'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-10">
              <div className="border-t border-gray-200 pt-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <ScoreRing score={result.score} />
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <div className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Matched Keywords</h3>
                        <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          {result.keywords?.matched?.length ?? 0} matched
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keywords?.matched?.map((kw) => (
                          <span key={kw} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">{kw}</span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">Missing Keywords</h3>
                        <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                          {result.keywords?.missing?.length ?? 0} missing
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keywords?.missing?.map((kw) => (
                          <span key={kw} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">{kw}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Insights</h2>
                <div className="space-y-3">
                  {result.insights?.map((ins, i) => {
                    const s = severityStyle[ins.severity] ?? severityStyle.ok
                    return (
                      <div key={i} className={`border-l-4 ${s.border} ${s.bg} rounded-r-xl p-5`}>
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full tracking-wide ${s.badge}`}>
                            {ins.severity.toUpperCase()}
                          </span>
                          <span className="text-sm font-semibold text-gray-800">{ins.title}</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{ins.body}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Suggested Rewrites</h2>
                <div className="space-y-4">
                  {result.rewrites?.map((rw, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      <div className="bg-red-50 px-5 py-4">
                        <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1.5">Before</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{stripMarkdown(rw.original)}</p>
                      </div>
                      <div className="bg-green-50 px-5 py-4 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1.5">After</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{stripMarkdown(rw.rewritten)}</p>
                        </div>
                        <CopyButton text={stripMarkdown(rw.rewritten)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center pt-6 border-t border-gray-100">
                <button onClick={handleReset}
                  className="px-6 py-2.5 border border-indigo-500 text-indigo-600 font-semibold
                             rounded-lg hover:bg-indigo-50 transition-colors text-sm">
                  ↑ Analyze Another Resume
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
