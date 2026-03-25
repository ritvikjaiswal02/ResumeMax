'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getUsage } from '@/lib/api'
import AnalysisResults from '@/components/AnalysisResults'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const JD_MAX         = 3000
const FILE_MAX_BYTES = 5 * 1024 * 1024
const INPUT_HEIGHT   = '288px'
const truncate = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : str

/* ─── Step Indicator ─── */
const STEPS = ['Upload Resume', 'Add Job Description', 'Get Analysis']

function StepIndicator({ resumeFile, jobDescription, result }) {
  const active =
    result ? 3 :
    resumeFile && jobDescription.trim().length > 0 ? 2 :
    resumeFile ? 1 : 0

  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((label, i) => {
        const done    = i < active
        const current = i === active && !result
        const ahead   = i > active

        return (
          <div key={i} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? '1' : undefined }}>
            {/* Step pill */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] font-black transition-all duration-300"
                style={
                  done    ? { background: 'var(--success)', color: '#0d0d11' } :
                  current ? { background: 'var(--gold)',    color: '#0d0d11' } :
                            { background: 'var(--surface-3)', color: 'var(--dim)' }
                }>
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : i + 1}
              </div>
              <span
                className="text-xs font-semibold transition-colors duration-300 hidden sm:block"
                style={{
                  color: done ? 'var(--success)' : current ? 'var(--foreground)' : 'var(--dim)',
                }}>
                {label}
              </span>
            </div>

            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-3 h-px transition-all duration-500"
                style={{ background: done ? 'var(--success)' : 'var(--surface-3)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Loading Steps ─── */
const LOADING_STEPS = [
  'Parsing resume PDF…',
  'Matching keywords…',
  'Scoring alignment…',
  'Generating insights…',
]

function LoadingSteps() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const intervals = [900, 1800, 2700]
    const timers = intervals.map((delay, i) =>
      setTimeout(() => setCurrent(i + 1), delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-40 gap-8">
      {/* Spinner */}
      <div className="relative w-16 h-16">
        <svg className="spin absolute inset-0 w-16 h-16" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="27" stroke="var(--surface-3)" strokeWidth="4" />
          <circle cx="32" cy="32" r="27" stroke="var(--gold)" strokeWidth="4"
            strokeDasharray="42 128" strokeLinecap="round" />
        </svg>
      </div>

      {/* Step list */}
      <div className="flex flex-col gap-3 min-w-[220px]">
        {LOADING_STEPS.map((step, i) => {
          const done    = i < current
          const running = i === current

          return (
            <div key={i}
              className="flex items-center gap-3 transition-all duration-300"
              style={{ opacity: i > current ? 0.3 : 1 }}>
              <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                style={
                  done    ? { background: 'var(--success)' } :
                  running ? { background: 'rgba(233,185,76,0.15)', border: '1.5px solid var(--gold)' } :
                            { background: 'var(--surface-3)' }
                }>
                {done ? (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5l2 2 4-4" stroke="var(--background)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : running ? (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold)' }} />
                ) : null}
              </div>
              <span className="text-sm font-medium transition-colors"
                style={{
                  color: done ? 'var(--success)' : running ? 'var(--foreground)' : 'var(--dim)',
                }}>
                {step}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── PDF Upload Zone ─── */
function PdfUploadZone({ file, onFile, onClear }) {
  const inputRef = useRef(null)
  const [drag, setDrag]   = useState(false)
  const [hover, setHover] = useState(false)

  const validate = (f) => {
    if (!f) return
    if (f.type !== 'application/pdf') { onFile(null, 'Only PDF files are accepted.'); return }
    if (f.size > FILE_MAX_BYTES)      { onFile(null, 'File too large. Max 5MB.'); return }
    onFile(f, null)
  }

  const active = drag || hover

  /* ── File confirmed ── */
  if (file) return (
    <div
      className="flex items-center gap-4 px-5 rounded-xl border-2 transition-all duration-300"
      style={{
        height: INPUT_HEIGHT,
        borderColor: 'rgba(74,222,128,0.4)',
        background: 'rgba(74,222,128,0.05)',
      }}>
      {/* File icon */}
      <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center"
        style={{ background: 'rgba(74,222,128,0.12)' }}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          style={{ color: 'var(--success)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 3v5a1 1 0 001 1h5" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        {/* Check badge */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: 'var(--success)' }}>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1 4l2 2 4-4" stroke="#0d0d11" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--success)' }}>
            Resume uploaded
          </span>
        </div>
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{file.name}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {(file.size / 1024).toFixed(0)} KB
        </p>
      </div>
      <button onClick={onClear}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-all"
        style={{ color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.25)', background: 'rgba(248,113,113,0.06)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.14)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.06)' }}>
        Remove
      </button>
    </div>
  )

  /* ── Empty dropzone ── */
  return (
    <div
      className="upload-zone flex flex-col items-center justify-center gap-4 rounded-xl cursor-pointer border-2 border-dashed transition-all duration-200"
      style={{
        height: INPUT_HEIGHT,
        background: active ? 'rgba(233,185,76,0.04)' : 'var(--surface-2)',
        borderColor: active ? 'var(--gold)' : 'rgba(255,255,255,0.09)',
        boxShadow: active ? '0 0 0 3px rgba(233,185,76,0.12)' : 'none',
      }}
      onClick={() => inputRef.current.click()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); validate(e.dataTransfer.files[0]) }}
    >
      <div className="scan-line" />
      <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200"
        style={{ background: active ? 'rgba(233,185,76,0.18)' : 'rgba(233,185,76,0.08)' }}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          style={{ color: 'var(--gold)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 3v5a1 1 0 001 1h5" />
        </svg>
      </div>
      <div className="text-center px-6">
        <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
          Drop your PDF here, or{' '}
          <span className="font-semibold" style={{ color: 'var(--gold)' }}>click to browse</span>
        </p>
        <p className="text-xs mt-1.5" style={{ color: 'var(--dim)' }}>PDF only · max 5 MB</p>
      </div>
      <input ref={inputRef} type="file" accept=".pdf" className="hidden"
        onChange={(e) => validate(e.target.files[0])} />
    </div>
  )
}

/* ─── Auth Modal ─── */
function AuthModal({ onClose, signInWithGoogle, signInWithEmail }) {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [sending, setSending] = useState(false)

  const sendLink = async () => {
    if (!email.trim()) return
    setSending(true)
    await signInWithEmail(email.trim())
    setSent(true); setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.72)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rounded-2xl shadow-2xl p-8 w-full max-w-sm relative"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <button onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-base"
          style={{ color: 'var(--dim)' }}>✕</button>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>Sign in to ResumeLens</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>Get 5 free analyses per month</p>

        <button onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 h-11 rounded-xl text-sm font-semibold transition-all mb-4"
          style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'var(--surface-2)', color: 'var(--foreground)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--dim)' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {sent ? (
          <div className="text-center py-3">
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Check your email ✓</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{email}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendLink()}
              className="w-full h-11 px-3.5 rounded-xl text-sm outline-none transition-all dark-input" />
            <button onClick={sendLink} disabled={sending || !email.trim()}
              className="w-full h-11 text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: 'var(--gold)', color: 'var(--background)' }}>
              {sending ? 'Sending…' : 'Send magic link'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Paywall Modal ─── */
function PaywallModal({ onClose, onUpgrade, upgradeLoading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.72)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center relative"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <button onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg"
          style={{ color: 'var(--dim)' }}>✕</button>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(233,185,76,0.12)' }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            style={{ color: 'var(--gold)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>Monthly limit reached</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
          You&apos;ve used your 5 free analyses this month.<br />
          Upgrade to Pro for unlimited analyses — ₹499/month.
        </p>
        <button onClick={onUpgrade} disabled={upgradeLoading}
          className="w-full h-11 text-sm font-bold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all mb-3"
          style={{ background: 'var(--gold)', color: 'var(--background)' }}>
          {upgradeLoading ? 'Opening payment…' : 'Upgrade to Pro — ₹499/month'}
        </button>
        <button onClick={onClose} className="text-sm" style={{ color: 'var(--dim)' }}>
          Come back next month
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   ANALYZE PAGE
═══════════════════════════════════════════════════════════ */
export default function AnalyzePage() {
  const topRef = useRef(null)
  const { user, session, loading: authLoading, signOut, signInWithGoogle, signInWithEmail } = useAuth()

  const [authError, setAuthError]           = useState(false)
  const [resumeFile, setResumeFile]         = useState(null)
  const [fileError, setFileError]           = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jdFocused, setJdFocused]           = useState(false)
  const [loading, setLoading]               = useState(false)
  const [result, setResult]                 = useState(null)
  const [error, setError]                   = useState('')
  const [showAuthModal, setShowAuthModal]   = useState(false)
  const [showPaywall, setShowPaywall]       = useState(false)
  const [usage, setUsage]                   = useState(null)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)

  const [coverLetter, setCoverLetter]             = useState(null)
  const [coverLetterLoading, setCoverLetterLoading] = useState(false)
  const [coverLetterError, setCoverLetterError]   = useState('')
  const [coverLetterCopied, setCoverLetterCopied] = useState(false)

  const [outreachMode, setOutreachMode]           = useState('email')
  const [outreachResult, setOutreachResult]       = useState(null)
  const [outreachLoading, setOutreachLoading]     = useState(false)
  const [outreachError, setOutreachError]         = useState('')
  const [outreachCopied, setOutreachCopied]       = useState(false)
  const [recruiterName, setRecruiterName]         = useState('')
  const [companyName, setCompanyName]             = useState('')

  const [interviewQuestions, setInterviewQuestions] = useState(null)
  const [interviewLoading, setInterviewLoading]     = useState(false)
  const [interviewError, setInterviewError]         = useState('')

  const [previousResult, setPreviousResult]       = useState(null)
  const [comparisonSummary, setComparisonSummary] = useState(null)
  const [reanalyzing, setReanalyzing]             = useState(false)
  const [showReanalyzePanel, setShowReanalyzePanel] = useState(false)
  const [reanalyzeFile, setReanalyzeFile]         = useState(null)
  const [reanalyzeJd, setReanalyzeJd]             = useState('')
  const [reanalyzeJdFocused, setReanalyzeJdFocused] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setAuthError(params.get('auth_error') === 'true')
    // Prefill JD if navigated from history "Re-analyze this role"
    const prefill = sessionStorage.getItem('rl_prefill_jd')
    if (prefill) {
      setJobDescription(prefill)
      sessionStorage.removeItem('rl_prefill_jd')
    }
  }, [])

  useEffect(() => {
    if (!session) { setUsage(null); return }
    getUsage(session.access_token).then(setUsage)
  }, [session])

  useEffect(() => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.async = true
    document.body.appendChild(s)
    return () => document.body.removeChild(s)
  }, [])

  const handleUpgrade = async () => {
    if (!session) return
    setUpgradeLoading(true)
    try {
      const orderRes  = await fetch('/api/razorpay/create-order', {
        method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error)

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount, currency: orderData.currency,
        name: 'ResumeLens', description: 'Pro Plan — Unlimited Analyses',
        order_id: orderData.order_id, prefill: { email: user?.email || '' },
        theme: { color: '#e9b94c' },
        handler: async (response) => {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            }),
          })
          const v = await verifyRes.json()
          if (v.success) {
            setShowPaywall(false)
            getUsage(session.access_token).then(setUsage)
            setUpgradeSuccess(true)
            setTimeout(() => setUpgradeSuccess(false), 4000)
          } else {
            alert('Payment verification failed. Please contact support.')
          }
          setUpgradeLoading(false)
        },
        modal: { ondismiss: () => setUpgradeLoading(false) },
      })
      rzp.on('payment.failed', (r) => {
        alert('Payment failed: ' + r.error.description); setUpgradeLoading(false)
      })
      rzp.open()
    } catch {
      alert('Something went wrong. Please try again.')
      setUpgradeLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!user) { setShowAuthModal(true); return }
    setError(''); setResult(null); setLoading(true)
    try {
      const formData = new FormData()
      formData.append('resume', resumeFile)
      formData.append('jobDescription', jobDescription)
      const res  = await fetch('/api/analyze', {
        method: 'POST', body: formData,
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (res.status === 403) {
        setShowPaywall(true)
        getUsage(session.access_token).then(setUsage)
      } else if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
      } else {
        setResult(data)
        getUsage(session.access_token).then(setUsage)
      }
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCoverLetter = async () => {
    if (!session) { setShowAuthModal(true); return }
    // Pro gate — show paywall if free
    if (usage?.plan !== 'pro') { setShowPaywall(true); return }

    setCoverLetterError(''); setCoverLetter(null); setCoverLetterLoading(true)
    try {
      const formData = new FormData()
      formData.append('resume', resumeFile)
      formData.append('jobDescription', jobDescription)
      formData.append('userName', user?.email?.split('@')[0] || '')
      const res  = await fetch('/api/cover-letter', {
        method: 'POST', body: formData,
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        setCoverLetterError(data.message || 'Generation failed. Please try again.')
      } else {
        setCoverLetter(data.coverLetter)
      }
    } catch {
      setCoverLetterError('Could not reach the server. Please try again.')
    } finally {
      setCoverLetterLoading(false)
    }
  }

  const handleCopyCoverLetter = () => {
    if (!coverLetter) return
    navigator.clipboard.writeText(coverLetter)
    setCoverLetterCopied(true)
    setTimeout(() => setCoverLetterCopied(false), 2000)
  }

  const handleGenerateOutreach = async () => {
    if (!session) { setShowAuthModal(true); return }
    if (usage?.plan !== 'pro') { setShowPaywall(true); return }
    setOutreachError(''); setOutreachResult(null); setOutreachLoading(true)
    try {
      const fd = new FormData()
      fd.append('resume', resumeFile)
      fd.append('jobDescription', jobDescription)
      fd.append('userName', user?.email?.split('@')[0] || '')
      fd.append('recruiterName', recruiterName)
      fd.append('companyName', companyName)
      const res  = await fetch('/api/cold-outreach', {
        method: 'POST', body: fd,
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (!res.ok) setOutreachError(data.message || 'Generation failed. Please try again.')
      else setOutreachResult(data)
    } catch {
      setOutreachError('Could not reach the server. Please try again.')
    } finally {
      setOutreachLoading(false)
    }
  }

  const handleCopyOutreach = () => {
    if (!outreachResult) return
    const text = outreachMode === 'email'
      ? `Subject: ${outreachResult.coldEmail.subject}\n\n${outreachResult.coldEmail.body}`
      : outreachResult.linkedInDm
    navigator.clipboard.writeText(text)
    setOutreachCopied(true)
    setTimeout(() => setOutreachCopied(false), 2000)
  }

  const handleGenerateInterviewPrep = async () => {
    if (!session) { setShowAuthModal(true); return }
    if (usage?.plan !== 'pro') { setShowPaywall(true); return }
    setInterviewError(''); setInterviewQuestions(null); setInterviewLoading(true)
    try {
      const fd = new FormData()
      fd.append('resume', resumeFile)
      fd.append('jobDescription', jobDescription)
      const res  = await fetch('/api/interview-prep', {
        method: 'POST', body: fd,
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (!res.ok) setInterviewError(data.message || 'Generation failed. Please try again.')
      else setInterviewQuestions(data.questions)
    } catch {
      setInterviewError('Could not reach the server. Please try again.')
    } finally {
      setInterviewLoading(false)
    }
  }

  const [coverLetterDownloading, setCoverLetterDownloading] = useState(false)

  const handleDownloadCoverLetter = async () => {
    if (!coverLetter || coverLetterDownloading) return
    setCoverLetterDownloading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })

      const marginX     = 25
      const marginTop   = 30
      const marginBot   = 25
      const pageWidth   = doc.internal.pageSize.getWidth()
      const pageHeight  = doc.internal.pageSize.getHeight()
      const usableWidth = pageWidth - marginX * 2
      const lineH       = 6.5   // mm per line at 11pt

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)

      // Split preserving blank lines (paragraph breaks)
      const paragraphs = coverLetter.split(/\n/)
      const lines = []
      for (const para of paragraphs) {
        if (para.trim() === '') {
          lines.push('')
        } else {
          const wrapped = doc.splitTextToSize(para, usableWidth)
          lines.push(...wrapped)
        }
      }

      let y = marginTop
      for (const line of lines) {
        if (y + lineH > pageHeight - marginBot) {
          doc.addPage()
          y = marginTop
        }
        if (line !== '') doc.text(line, marginX, y)
        y += lineH
      }

      doc.save('cover_letter.pdf')
    } finally {
      setCoverLetterDownloading(false)
    }
  }

  const handleReanalyze = async () => {
    if (!user) { setShowAuthModal(true); return }
    const fileToUse = reanalyzeFile   // pre-populated when panel opens; null means user cleared it
    const jdToUse   = reanalyzeJd.trim() || jobDescription
    if (!fileToUse || !jdToUse) return

    // Save current result before overwriting
    const prev = result
    setPreviousResult(prev)
    setComparisonSummary(null)
    setReanalyzing(true)
    setShowReanalyzePanel(false)
    setCoverLetter(null)

    try {
      const formData = new FormData()
      formData.append('resume', fileToUse)
      formData.append('jobDescription', jdToUse)
      const res  = await fetch('/api/analyze', {
        method: 'POST', body: formData,
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (res.status === 403) {
        setShowPaywall(true)
        setPreviousResult(null)
        getUsage(session.access_token).then(setUsage)
      } else if (!res.ok) {
        setPreviousResult(null)
      } else {
        // Update state with new result
        setResult(data)
        if (reanalyzeFile) setResumeFile(reanalyzeFile)
        if (reanalyzeJd.trim()) setJobDescription(reanalyzeJd)
        setReanalyzeFile(null)
        setReanalyzeJd('')
        getUsage(session.access_token).then(setUsage)

        // Fetch improvement summary (non-blocking)
        const prevMatched = prev?.keywords?.matched ?? []
        const newMatched  = data?.keywords?.matched ?? []
        const addedKeywords = newMatched.filter(k => !prevMatched.includes(k))
        fetch('/api/improve-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            previousScore: prev.score,
            newScore: data.score,
            previousMissing: prev?.keywords?.missing ?? [],
            newMissing: data?.keywords?.missing ?? [],
            addedKeywords,
          }),
        }).then(r => r.json()).then(d => { if (d.summary) setComparisonSummary(d.summary) })
      }
    } catch {
      setPreviousResult(null)
    } finally {
      setReanalyzing(false)
    }
  }

  const handleReset = () => {
    setResumeFile(null); setFileError('')
    setJobDescription(''); setResult(null); setError('')
    setCoverLetter(null); setCoverLetterError('')
    setPreviousResult(null); setComparisonSummary(null)
    setReanalyzing(false); setShowReanalyzePanel(false)
    setReanalyzeFile(null); setReanalyzeJd('')
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const atLimit    = usage?.plan === 'free' && usage?.analyses_used >= 5
  const bothReady  = !!resumeFile && jobDescription.trim().length > 0
  const canAnalyze = bothReady && !loading && !atLimit

  return (
    <div ref={topRef} className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>

      {/* ── Toasts ── */}
      {authError && (
        <div className="fixed top-0 inset-x-0 z-50 text-sm text-center py-2 px-4 font-medium"
          style={{ background: 'var(--danger)', color: '#fff' }}>
          Sign-in failed — your session may have expired. Please try again.
        </div>
      )}
      {upgradeSuccess && (
        <div className="fixed top-0 inset-x-0 z-50 text-sm text-center py-2 px-4 font-medium"
          style={{ background: 'var(--success)', color: '#0d0d11' }}>
          You&apos;re now on Pro. Unlimited analyses unlocked. ✓
        </div>
      )}

      {/* ── Modals ── */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)}
          signInWithGoogle={signInWithGoogle} signInWithEmail={signInWithEmail} />
      )}
      {showPaywall && (
        <PaywallModal onClose={() => setShowPaywall(false)}
          onUpgrade={handleUpgrade} upgradeLoading={upgradeLoading} />
      )}

      {/* ── Navbar ── */}
      <nav className="no-print sticky top-0 z-10"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--foreground)' }}>Resume<span style={{ color: 'var(--gold)' }}>Lens</span></span>
            </Link>
            {user && (
              <Link href="/history"
                className="text-sm font-medium hidden sm:block transition-colors"
                style={{ color: 'var(--muted-foreground)' }}>
                History
              </Link>
            )}
          </div>

          {authLoading ? null : user ? (
            <div className="flex items-center gap-3">
              {usage && (
                usage.plan === 'pro' ? (
                  <Badge variant="outline" className="font-bold rounded-full hidden sm:inline-flex text-xs"
                    style={{ color: 'var(--success)', background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.22)' }}>
                    Pro · unlimited
                  </Badge>
                ) : (
                  <Badge variant="outline" className="font-bold rounded-full hidden sm:inline-flex text-xs"
                    style={
                      usage.analyses_used === 0
                        ? { color: 'var(--muted-foreground)', background: 'transparent', borderColor: 'var(--border)' }
                        : usage.analyses_used === 1
                        ? { color: 'var(--warn)', background: 'rgba(251,146,60,0.08)', borderColor: 'rgba(251,146,60,0.22)' }
                        : { color: 'var(--danger)', background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.22)' }
                    }>
                    {usage.analyses_used} / 5 analyses
                  </Badge>
                )
              )}
              <span className="text-sm hidden sm:block" style={{ color: 'var(--dim)' }}>
                {truncate(user.email, 22)}
              </span>
              <button onClick={signOut}
                className="text-xs font-semibold px-3 h-7 rounded-lg transition-all"
                style={{ color: 'var(--dim)', border: '1px solid var(--border)', background: 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.35)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--dim)';    e.currentTarget.style.borderColor = 'var(--border)' }}>
                Sign out
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)}
              className="text-xs font-semibold px-3 h-7 rounded-lg transition-all"
              style={{ color: 'var(--gold)', border: '1px solid rgba(233,185,76,0.35)', background: 'transparent' }}>
              Sign in
            </button>
          )}
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

        {/* ════ INPUT FORM ════ */}
        {!result && !loading && (
          <div className="anim-fade-up">

            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-4xl font-extrabold tracking-tight leading-tight"
                style={{ color: 'var(--foreground)' }}>
                Analyze Your Resume
              </h1>
              <p className="text-base mt-2" style={{ color: 'var(--muted-foreground)' }}>
                Match your resume to any job description in seconds.
              </p>
            </div>

            {/* Step indicator */}
            <StepIndicator
              resumeFile={resumeFile}
              jobDescription={jobDescription}
              result={result}
            />

            {/* Two-column inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Left — PDF upload */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--muted-foreground)' }}>
                  1 · Resume PDF
                </label>
                <PdfUploadZone
                  file={resumeFile}
                  onFile={(f, err) => { setResumeFile(f); setFileError(err || '') }}
                  onClear={() => { setResumeFile(null); setFileError('') }}
                />
                {fileError && (
                  <p className="text-xs" style={{ color: 'var(--danger)' }}>{fileError}</p>
                )}
              </div>

              {/* Right — Job description */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: 'var(--muted-foreground)' }}>
                    2 · Job Description
                  </label>
                  <span className="text-xs tabular-nums" style={{ color: 'var(--dim)' }}>
                    {jobDescription.length} / {JD_MAX}
                  </span>
                </div>
                <textarea
                  className="resize-none rounded-xl px-4 py-3.5 text-sm leading-relaxed outline-none transition-all"
                  style={{
                    height: INPUT_HEIGHT,
                    background: 'var(--surface-2)',
                    border: `1.5px solid ${jdFocused ? 'var(--gold)' : jobDescription.trim().length > 0 ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.09)'}`,
                    boxShadow: jdFocused ? '0 0 0 3px rgba(233,185,76,0.14)' : 'none',
                    color: 'var(--foreground)',
                    fontFamily: 'inherit',
                  }}
                  placeholder="Paste the full job description here…"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  onFocus={() => setJdFocused(true)}
                  onBlur={() => setJdFocused(false)}
                  maxLength={JD_MAX}
                />
              </div>
            </div>

            {/* ── CTA bridge ── */}
            <div className="mt-8 flex flex-col items-center gap-4">

              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                title={atLimit ? "Monthly limit reached. Upgrade to continue." : undefined}
                className="h-12 px-10 font-bold rounded-xl transition-all text-[0.9375rem] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                style={{
                  background: canAnalyze ? 'var(--gold)' : 'var(--surface-3)',
                  color: canAnalyze ? 'var(--background)' : 'var(--dim)',
                  boxShadow: canAnalyze ? '0 0 20px rgba(233,185,76,0.22)' : 'none',
                  minWidth: '200px',
                }}>
                Analyze Resume →
              </button>

              {/* Limit warning */}
              {atLimit && (
                <p className="text-sm" style={{ color: 'var(--danger)' }}>
                  Monthly limit reached.{' '}
                  <button onClick={() => setShowPaywall(true)}
                    className="font-semibold underline hover:no-underline bg-transparent border-none cursor-pointer"
                    style={{ color: 'var(--gold)' }}>
                    Upgrade for unlimited
                  </button>
                </p>
              )}

              {/* Error */}
              {error && (
                <div className="w-full px-4 py-3 rounded-xl text-sm text-center"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--danger)' }}>
                  {error}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ════ LOADING ════ */}
        {loading && <LoadingSteps />}

        {/* ════ RESULTS ════ */}
        {result && (
          <div className="anim-fade-up">

            {/* Step indicator — all complete */}
            <StepIndicator resumeFile={resumeFile} jobDescription={jobDescription} result={result} />

            {/* Summary bar */}
            <div className="no-print flex items-center justify-between gap-4 mb-8 pb-5"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(233,185,76,0.1)' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    style={{ color: 'var(--gold)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                    {resumeFile?.name}
                  </p>
                  <p className="text-xs truncate hidden sm:block" style={{ color: 'var(--muted-foreground)' }}>
                    {jobDescription.trim().slice(0, 80)}{jobDescription.length > 80 ? '…' : ''}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset} className="shrink-0">
                ↑ Start Over
              </Button>
            </div>

            <AnalysisResults
              result={result}
              previousResult={previousResult}
              comparisonSummary={comparisonSummary}
              reanalyzing={reanalyzing}
            />

            {/* ── Cover Letter ── */}
            <div className="mt-12">
              {/* Section header */}
              <div className="flex items-start justify-between mb-5 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 rounded-full shrink-0" style={{ background: 'var(--gold)' }} />
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold tracking-tight">Cover Letter</h2>
                      {usage?.plan === 'pro' ? (
                        <Badge variant="outline" className="text-[0.7rem] font-bold rounded-full"
                          style={{ color: 'var(--success)', background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.22)' }}>
                          Pro
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[0.7rem] font-bold rounded-full"
                          style={{ color: 'var(--gold)', background: 'rgba(233,185,76,0.08)', borderColor: 'rgba(233,185,76,0.22)' }}>
                          Pro only
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      Tailored to this job description using your resume
                    </p>
                  </div>
                </div>

                {/* Generate / Regenerate button */}
                {!coverLetterLoading && (
                  <button
                    onClick={handleGenerateCoverLetter}
                    className="shrink-0 h-8 px-4 text-xs font-bold rounded-lg transition-all"
                    style={{
                      background: 'var(--gold)',
                      color: 'var(--background)',
                      opacity: coverLetterLoading ? 0.6 : 1,
                    }}>
                    {coverLetter ? 'Regenerate' : usage?.plan === 'pro' ? 'Generate →' : 'Upgrade to Generate →'}
                  </button>
                )}
              </div>

              {/* Loading */}
              {coverLetterLoading && (
                <div className="flex items-center gap-3 px-5 py-4 rounded-xl"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <svg className="spin shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="var(--surface-3)" strokeWidth="3" />
                    <circle cx="12" cy="12" r="9" stroke="var(--gold)" strokeWidth="3"
                      strokeDasharray="14 42" strokeLinecap="round" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    Writing your cover letter…
                  </span>
                </div>
              )}

              {/* Error */}
              {coverLetterError && (
                <div className="px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--danger)' }}>
                  {coverLetterError}
                </div>
              )}

              {/* Cover letter output */}
              {coverLetter && (
                <div className="rounded-xl overflow-hidden anim-fade-up"
                  style={{ border: '1px solid var(--border)' }}>
                  {/* Toolbar */}
                  <div className="flex items-center justify-between px-5 py-3"
                    style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        style={{ color: 'var(--gold)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                        cover_letter.pdf
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyCoverLetter}
                        className="h-7 px-3 text-xs font-semibold rounded-lg transition-all"
                        style={
                          coverLetterCopied
                            ? { background: 'rgba(74,222,128,0.12)', color: 'var(--success)', border: '1px solid rgba(74,222,128,0.3)' }
                            : { background: 'var(--surface-3)', color: 'var(--foreground)', border: '1px solid var(--border)' }
                        }>
                        {coverLetterCopied ? '✓ Copied' : 'Copy'}
                      </button>

                      <button
                        onClick={handleDownloadCoverLetter}
                        disabled={coverLetterDownloading}
                        className="h-7 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
                        style={{
                          background: coverLetterDownloading ? 'var(--surface-3)' : 'rgba(233,185,76,0.12)',
                          color: coverLetterDownloading ? 'var(--dim)' : 'var(--gold)',
                          border: '1px solid rgba(233,185,76,0.25)',
                          opacity: coverLetterDownloading ? 0.7 : 1,
                        }}>
                        {coverLetterDownloading ? (
                          <>
                            <svg className="spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3"
                                strokeDasharray="14 42" strokeLinecap="round" />
                            </svg>
                            Exporting…
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                            </svg>
                            PDF
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Letter body */}
                  <div className="px-7 py-6" style={{ background: 'var(--card)' }}>
                    <p className="text-sm leading-[1.85] whitespace-pre-wrap"
                      style={{ color: 'var(--foreground)', fontFamily: 'inherit' }}>
                      {coverLetter}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Cold Outreach ── */}
            <div className="mt-12">
              {/* Header row */}
              <div className="flex items-start justify-between mb-5 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 rounded-full shrink-0" style={{ background: 'var(--gold)' }} />
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold tracking-tight">Cold Outreach</h2>
                      {usage?.plan === 'pro' ? (
                        <Badge variant="outline" className="text-[0.7rem] font-bold rounded-full"
                          style={{ color: 'var(--success)', background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.22)' }}>
                          Pro
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[0.7rem] font-bold rounded-full"
                          style={{ color: 'var(--gold)', background: 'rgba(233,185,76,0.08)', borderColor: 'rgba(233,185,76,0.22)' }}>
                          Pro only
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      Personalized cold email or LinkedIn DM for this role
                    </p>
                  </div>
                </div>

                {/* Generate button */}
                {!outreachLoading && (
                  <button
                    onClick={handleGenerateOutreach}
                    disabled={!result}
                    className="shrink-0 h-8 px-4 text-xs font-bold rounded-lg transition-all"
                    style={{
                      background: 'var(--gold)',
                      color: 'var(--background)',
                      opacity: !result ? 0.4 : 1,
                    }}>
                    {outreachResult ? 'Regenerate' : usage?.plan === 'pro' ? 'Generate →' : 'Upgrade to Generate →'}
                  </button>
                )}
              </div>

              {/* Optional inputs */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-widest mb-1.5"
                    style={{ color: 'var(--dim)' }}>
                    Recruiter Name
                  </label>
                  <input
                    type="text"
                    value={recruiterName}
                    onChange={e => setRecruiterName(e.target.value)}
                    placeholder="e.g. Sarah (optional)"
                    className="w-full h-8 px-3 text-xs rounded-lg outline-none transition-all"
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-widest mb-1.5"
                    style={{ color: 'var(--dim)' }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. Google (optional)"
                    className="w-full h-8 px-3 text-xs rounded-lg outline-none transition-all"
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                    }}
                  />
                </div>
              </div>

              {/* Mode tabs */}
              <div className="flex items-center gap-1 mb-4">
                {[['email', 'Cold Email'], ['dm', 'LinkedIn DM']].map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setOutreachMode(mode)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
                    style={outreachMode === mode ? {
                      background: 'rgba(233,185,76,0.12)',
                      color: 'var(--gold)',
                      border: '1px solid rgba(233,185,76,0.3)',
                    } : {
                      background: 'transparent',
                      color: 'var(--dim)',
                      border: '1px solid transparent',
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Loading */}
              {outreachLoading && (
                <div className="flex items-center gap-3 px-5 py-4 rounded-xl"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <svg className="spin shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="var(--surface-3)" strokeWidth="3" />
                    <circle cx="12" cy="12" r="9" stroke="var(--gold)" strokeWidth="3"
                      strokeDasharray="14 42" strokeLinecap="round" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    Writing your outreach message…
                  </span>
                </div>
              )}

              {/* Error */}
              {outreachError && (
                <div className="px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--danger)' }}>
                  {outreachError}
                </div>
              )}

              {/* Output */}
              {outreachResult && (
                <div className="rounded-xl overflow-hidden anim-fade-up"
                  style={{ border: '1px solid var(--border)' }}>
                  {/* Toolbar */}
                  <div className="flex items-center justify-between px-5 py-3"
                    style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      {outreachMode === 'email' ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          style={{ color: 'var(--gold)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          style={{ color: 'var(--gold)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      )}
                      <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                        {outreachMode === 'email' ? 'cold_email.txt' : 'linkedin_dm.txt'}
                      </span>
                      {outreachMode === 'dm' && (
                        <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background: outreachResult.linkedInDm.length > 280
                              ? 'rgba(248,113,113,0.12)'
                              : 'rgba(74,222,128,0.1)',
                            color: outreachResult.linkedInDm.length > 280
                              ? 'var(--danger)'
                              : 'var(--success)',
                          }}>
                          {outreachResult.linkedInDm.length} chars
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleCopyOutreach}
                      className="h-7 px-3 text-xs font-semibold rounded-lg transition-all"
                      style={
                        outreachCopied
                          ? { background: 'rgba(74,222,128,0.12)', color: 'var(--success)', border: '1px solid rgba(74,222,128,0.3)' }
                          : { background: 'var(--surface-3)', color: 'var(--foreground)', border: '1px solid var(--border)' }
                      }>
                      {outreachCopied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* Body */}
                  <div className="px-7 py-6" style={{ background: 'var(--card)' }}>
                    {outreachMode === 'email' ? (
                      <>
                        <p className="text-xs font-semibold mb-3 pb-3"
                          style={{ color: 'var(--dim)', borderBottom: '1px solid var(--border)' }}>
                          Subject: <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>
                            {outreachResult.coldEmail.subject}
                          </span>
                        </p>
                        <p className="text-sm leading-[1.85] whitespace-pre-wrap"
                          style={{ color: 'var(--foreground)' }}>
                          {outreachResult.coldEmail.body}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm leading-[1.85] whitespace-pre-wrap"
                        style={{ color: 'var(--foreground)' }}>
                        {outreachResult.linkedInDm}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Interview Prep ── */}
            <div className="mt-10 no-print" style={{ borderLeft: '2px solid var(--gold)', paddingLeft: '1.25rem' }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Interview Prep</h3>
                    <span className="text-[0.6rem] font-black px-1.5 py-0.5 rounded tracking-widest"
                      style={{ background: 'rgba(233,185,76,0.15)', color: 'var(--gold)', border: '1px solid rgba(233,185,76,0.3)' }}>
                      PRO
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--dim)' }}>
                    Practice questions tailored to this role, with tips from your own resume
                  </p>
                </div>
                {!interviewLoading && (
                  <button
                    onClick={handleGenerateInterviewPrep}
                    disabled={!result}
                    className="shrink-0 h-8 px-4 text-xs font-bold rounded-lg transition-all"
                    style={{
                      background: result ? 'var(--gold)' : 'var(--surface-3)',
                      color: result ? '#0d0d11' : 'var(--dim)',
                      cursor: result ? 'pointer' : 'not-allowed',
                    }}>
                    {interviewQuestions ? 'Regenerate →' : 'Generate Questions →'}
                  </button>
                )}
              </div>

              {/* Loading */}
              {interviewLoading && (
                <div className="flex items-center gap-3 py-4">
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent' }} />
                  <span className="text-sm" style={{ color: 'var(--dim)' }}>Generating your questions…</span>
                </div>
              )}

              {/* Error */}
              {interviewError && (
                <div className="px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--danger)' }}>
                  {interviewError}
                </div>
              )}

              {/* Question Cards */}
              {interviewQuestions && (
                <div className="flex flex-col gap-3 anim-fade-up">
                  {interviewQuestions.map((q, i) => {
                    const catColor = q.category === 'Behavioral'
                      ? { bg: 'rgba(233,185,76,0.12)', color: 'var(--gold)', border: 'rgba(233,185,76,0.25)' }
                      : q.category === 'Technical'
                      ? { bg: 'rgba(99,179,237,0.1)', color: '#63b3ed', border: 'rgba(99,179,237,0.2)' }
                      : { bg: 'rgba(251,191,36,0.08)', color: 'var(--warn)', border: 'rgba(251,191,36,0.2)' }
                    return (
                      <div key={i} className="rounded-xl p-4"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        {/* Category + number */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[0.6rem] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: catColor.bg, color: catColor.color, border: `1px solid ${catColor.border}` }}>
                            {q.category}
                          </span>
                          <span className="text-[0.65rem] font-semibold" style={{ color: 'var(--dim)' }}>Q{i + 1}</span>
                        </div>
                        {/* Question */}
                        <p className="text-sm font-medium mb-3" style={{ color: 'var(--foreground)', lineHeight: '1.6' }}>
                          {q.question}
                        </p>
                        {/* Tip */}
                        <div className="flex gap-3 rounded-lg p-4"
                          style={{ background: 'rgba(120,60,10,0.2)', border: '1px solid rgba(233,185,76,0.2)' }}>
                          <div className="shrink-0 mt-0.5" style={{ color: 'var(--gold)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>
                            <strong style={{ color: 'var(--gold)', fontWeight: 500 }}>Tip: </strong>
                            {q.tip}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Re-analyze Panel ── */}
            <div className="mt-12 no-print">
              {/* Toggle header */}
              <button
                onClick={() => {
                  const opening = !showReanalyzePanel
                  setShowReanalyzePanel(opening)
                  if (opening) {
                    if (!reanalyzeJd) setReanalyzeJd(jobDescription)
                    if (!reanalyzeFile) setReanalyzeFile(resumeFile)  // pre-populate with current file
                  }
                }}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all group"
                style={{
                  background: showReanalyzePanel ? 'rgba(233,185,76,0.06)' : 'var(--surface-2)',
                  border: `1.5px solid ${showReanalyzePanel ? 'rgba(233,185,76,0.28)' : 'rgba(255,255,255,0.07)'}`,
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: showReanalyzePanel ? 'rgba(233,185,76,0.15)' : 'var(--surface-3)' }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 6.5a4.5 4.5 0 0 1 7.94-2.94M11 6.5a4.5 4.5 0 0 1-7.94 2.94"
                        stroke={showReanalyzePanel ? 'var(--gold)' : 'var(--dim)'}
                        strokeWidth="1.6" strokeLinecap="round"/>
                      <path d="M9.5 3l.44 1.56L11.5 4" stroke={showReanalyzePanel ? 'var(--gold)' : 'var(--dim)'}
                        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold" style={{ color: showReanalyzePanel ? 'var(--gold)' : 'var(--foreground)' }}>
                      Test Your Updates
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Upload an improved resume and re-run the analysis to see your progress
                    </p>
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                  className="shrink-0 transition-transform duration-200"
                  style={{ transform: showReanalyzePanel ? 'rotate(180deg)' : 'none', color: 'var(--dim)' }}>
                  <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Expanded panel */}
              {showReanalyzePanel && (
                <div className="mt-3 rounded-xl overflow-hidden anim-fade-up"
                  style={{ border: '1.5px solid rgba(233,185,76,0.2)', background: 'var(--surface)' }}>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* Left — new PDF upload */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: 'var(--muted-foreground)' }}>
                        Updated Resume
                      </label>
                      <PdfUploadZone
                        file={reanalyzeFile}
                        onFile={(f, err) => { if (!err) setReanalyzeFile(f) }}
                        onClear={() => setReanalyzeFile(null)}
                      />
                      {reanalyzeFile && reanalyzeFile !== resumeFile && (
                        <p className="text-xs" style={{ color: 'var(--success)' }}>
                          ✦ New file selected — will replace previous
                        </p>
                      )}
                    </div>

                    {/* Right — editable JD */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-widest"
                          style={{ color: 'var(--muted-foreground)' }}>
                          Job Description
                        </label>
                        <button
                          onClick={() => setReanalyzeJd(jobDescription)}
                          className="text-[0.68rem] font-semibold"
                          style={{ color: 'var(--dim)' }}>
                          Reset
                        </button>
                      </div>
                      <textarea
                        className="resize-none rounded-xl px-4 py-3.5 text-sm leading-relaxed outline-none transition-all"
                        style={{
                          height: INPUT_HEIGHT,
                          background: 'var(--surface-2)',
                          border: `1.5px solid ${reanalyzeJdFocused ? 'var(--gold)' : 'rgba(255,255,255,0.09)'}`,
                          boxShadow: reanalyzeJdFocused ? '0 0 0 3px rgba(233,185,76,0.14)' : 'none',
                          color: 'var(--foreground)',
                          fontFamily: 'inherit',
                        }}
                        value={reanalyzeJd}
                        onChange={(e) => setReanalyzeJd(e.target.value)}
                        onFocus={() => setReanalyzeJdFocused(true)}
                        onBlur={() => setReanalyzeJdFocused(false)}
                        maxLength={JD_MAX}
                        placeholder="Edit the job description if needed…"
                      />
                    </div>
                  </div>

                  {/* Re-analyze CTA */}
                  <div className="px-5 pb-5 flex items-center justify-center">
                    <button
                      onClick={handleReanalyze}
                      disabled={reanalyzing || !reanalyzeFile}
                      className="h-12 px-10 font-bold rounded-xl transition-all text-[0.9375rem] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: 'var(--gold)', color: 'var(--background)',
                        boxShadow: '0 0 20px rgba(233,185,76,0.22)',
                        minWidth: '220px',
                      }}>
                      {reanalyzing ? 'Re-analyzing…' : 'Re-analyze →'}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  )
}
