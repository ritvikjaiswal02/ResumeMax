'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check, ChevronDown, Copy, Download, FileText, FileUp, Gift, Lightbulb, Lock, Mail,
  MessageSquare, RefreshCw, RotateCcw, TriangleAlert, X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getUsage } from '@/lib/api'
import AnalysisResults from '@/components/AnalysisResults'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AppNav from '@/components/landing/AppNav'
import { PrimaryButton, SecondaryButton, Stage, Surface, ToolTag } from '@/components/landing/primitives'
import { INK, LINE, MIST, MUTED, SUCCESS, TEXT, TOOLS } from '@/components/landing/tokens'
import { cn } from '@/lib/utils'

const JD_MAX         = 3000
const FILE_MAX_BYTES = 5 * 1024 * 1024
const INPUT_HEIGHT   = '288px'
const truncate = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : str

const ERROR_BG   = '#FDE8E7'
const ERROR_TEXT = '#B42318'

const INPUT_CLASS =
  'h-11 rounded-[10px] border-[#E3E6E1] bg-white px-3.5 text-[16px] text-[#0D0F0E] shadow-[0_1px_2px_rgba(13,15,14,0.04)] transition-[border-color,box-shadow] placeholder:text-[#9AA09C] hover:border-[#D5D9D3] focus-visible:border-[#0D0F0E] focus-visible:ring-4 focus-visible:ring-[#0D0F0E]/10 md:text-[15px]'
const TEXTAREA_CLASS =
  'resize-none rounded-[12px] border-[#E3E6E1] bg-white px-4 py-3.5 text-[15px] leading-[1.6] text-[#0D0F0E] transition-[border-color,box-shadow] placeholder:text-[#9AA09C] hover:border-[#D5D9D3] focus-visible:border-[#0D0F0E] focus-visible:ring-4 focus-visible:ring-[#0D0F0E]/10'
const SMALL_BTN = 'h-9 gap-1.5 px-3.5 text-[13.5px]'

/* ─── Small shared bits ─── */
function Spinner({ size = 16, color = INK, track = LINE }) {
  return (
    <svg className="spin shrink-0" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={track} strokeWidth="3" />
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="3" strokeDasharray="14 42" strokeLinecap="round" />
    </svg>
  )
}

function ErrorNote({ children, className }) {
  return (
    <div role="alert" className={cn('flex items-start gap-2.5 rounded-[12px] px-4 py-3 text-[14px] leading-[1.5]', className)}
      style={{ background: ERROR_BG, color: ERROR_TEXT }}>
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  )
}

function WorkingNote({ children }) {
  return (
    <Surface className="flex items-center gap-3 px-5 py-4" role="status">
      <Spinner color={INK} />
      <span className="text-[14.5px] font-medium" style={{ color: TEXT }}>{children}</span>
    </Surface>
  )
}

function FieldLabel({ htmlFor, id, children }) {
  return (
    <Label htmlFor={htmlFor} id={id} className="text-[14px] font-medium" style={{ color: INK }}>
      {children}
    </Label>
  )
}

/* Header for each Pro tool section: tool tag, title, description, action. */
function ToolHeader({ tool, id, title, description, status, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <ToolTag tool={tool} />
          {status && (
            <span className="inline-flex h-5 items-center rounded-full bg-white px-2 text-[11px] font-medium" style={{ color: TOOLS[tool].deep }}>
              {status}
            </span>
          )}
        </div>
        <h2 id={id} className="mt-3 text-[24px] font-medium sm:text-[28px]" style={{ color: INK, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
          {title}
        </h2>
        <p className="mt-2 max-w-[520px] text-[15px] leading-[1.55]" style={{ color: TOOLS[tool].deep }}>
          {description}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ─── Step Indicator ─── */
const STEPS = ['Upload resume', 'Add job description', 'Get your analysis']

function StepIndicator({ resumeFile, jobDescription, result }) {
  const active =
    result ? 3 :
    resumeFile && jobDescription.trim().length > 0 ? 2 :
    resumeFile ? 1 : 0

  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2" aria-label="Progress">
      {STEPS.map((label, i) => {
        const done    = i < active
        const current = i === active && !result

        return (
          <li key={i} className="flex items-center gap-2" aria-current={current ? 'step' : undefined}>
            <span
              className="inline-flex h-8 items-center gap-2 rounded-full pl-1 pr-3 text-[13.5px] font-medium transition-colors"
              style={
                done    ? { background: TOOLS.resume.tint, color: TOOLS.resume.deep } :
                current ? { background: INK, color: '#fff' } :
                          { background: MIST, color: MUTED }
              }>
              <span
                className="grid size-6 place-items-center rounded-full text-[12px] font-semibold"
                style={
                  done    ? { background: TOOLS.resume.strong, color: '#fff' } :
                  current ? { background: '#fff', color: INK } :
                            { background: '#fff', color: MUTED, boxShadow: `inset 0 0 0 1px ${LINE}` }
                }>
                {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : i + 1}
              </span>
              <span className={cn(!current && 'hidden sm:inline')}>{label}</span>
              {done && <span className="sr-only">(done)</span>}
            </span>
            {i < STEPS.length - 1 && (
              <span aria-hidden className="h-px w-4 sm:w-8" style={{ background: done ? TOOLS.resume.strong : LINE }} />
            )}
          </li>
        )
      })}
    </ol>
  )
}

/* ─── Loading Steps ─── */
const LOADING_STEPS = [
  'Reading your resume',
  'Matching keywords',
  'Scoring alignment',
  'Writing suggestions',
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
    <Stage tool="resume" className="flex justify-center py-16 sm:py-24" role="status" aria-live="polite">
      <Surface className="flex w-full max-w-[360px] flex-col items-center gap-7 px-6 py-9 sm:px-8">
        <Spinner size={44} color={INK} track={TOOLS.resume.tint} />
        <div className="text-center">
          <p className="text-[18px] font-medium" style={{ color: INK, letterSpacing: '-0.02em' }}>Checking your resume</p>
          <p className="mt-1 text-[14px]" style={{ color: MUTED }}>This usually takes a few seconds.</p>
        </div>

        <ol className="flex w-full flex-col gap-3">
          {LOADING_STEPS.map((step, i) => {
            const done    = i < current
            const running = i === current

            return (
              <li key={i}
                className="flex items-center gap-3 transition-opacity duration-300"
                style={{ opacity: i > current ? 0.45 : 1 }}>
                <span className="grid size-5 shrink-0 place-items-center rounded-full"
                  style={
                    done    ? { background: TOOLS.resume.strong, color: '#fff' } :
                    running ? { background: TOOLS.resume.tint, boxShadow: `inset 0 0 0 1.5px ${TOOLS.resume.strong}` } :
                              { background: MIST, boxShadow: `inset 0 0 0 1px ${LINE}` }
                  }>
                  {done ? (
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  ) : running ? (
                    <span className="size-1.5 rounded-full" style={{ background: TOOLS.resume.strong }} />
                  ) : null}
                </span>
                <span className="text-[14.5px] font-medium"
                  style={{ color: done ? TOOLS.resume.deep : running ? INK : MUTED }}>
                  {step}
                </span>
              </li>
            )
          })}
        </ol>
      </Surface>
    </Stage>
  )
}

/* ─── PDF Upload Zone ─── */
function PdfUploadZone({ file, onFile, onClear, labelledBy }) {
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
      className="flex flex-col items-center justify-center gap-4 rounded-[14px] px-5 text-center"
      style={{ height: INPUT_HEIGHT, background: TOOLS.resume.tint }}>
      <span className="grid size-12 place-items-center rounded-[12px] bg-white" style={{ color: TOOLS.resume.deep }}>
        <FileText className="size-6" aria-hidden />
      </span>
      <div className="min-w-0 max-w-full">
        <p className="inline-flex items-center gap-1.5 text-[13px] font-medium" style={{ color: TOOLS.resume.deep }}>
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
          Resume added
        </p>
        <p className="mt-1 truncate text-[15px] font-medium" style={{ color: INK }}>{file.name}</p>
        <p className="mt-0.5 text-[13px]" style={{ color: TOOLS.resume.deep }}>
          {(file.size / 1024).toFixed(0)} KB
        </p>
      </div>
      <SecondaryButton onClick={onClear} className={cn(SMALL_BTN, 'border-transparent')} aria-label={`Remove ${file.name}`}>
        <X className="size-4" aria-hidden />
        Remove
      </SecondaryButton>
    </div>
  )

  /* ── Empty dropzone ── */
  return (
    <div
      role="button"
      tabIndex={0}
      aria-labelledby={labelledBy}
      aria-describedby={labelledBy ? `${labelledBy}-hint` : undefined}
      className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[14px] border-2 border-dashed px-6 text-center outline-none transition-colors duration-200 focus-visible:border-[#0D0F0E] focus-visible:ring-4 focus-visible:ring-[#0D0F0E]/10"
      style={{
        height: INPUT_HEIGHT,
        background: active ? TOOLS.resume.tint : MIST,
        borderColor: active ? TOOLS.resume.strong : '#D5D9D3',
      }}
      onClick={() => inputRef.current.click()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current.click() } }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); validate(e.dataTransfer.files[0]) }}
    >
      <span className="grid size-12 place-items-center rounded-[12px] bg-white"
        style={{ color: active ? TOOLS.resume.deep : INK, boxShadow: `0 0 0 1px ${LINE}` }}>
        <FileUp className="size-6" aria-hidden />
      </span>
      <div>
        <p className="text-[15px] font-medium" style={{ color: INK }}>
          Drop your PDF here, or <span className="underline underline-offset-4">browse</span>
        </p>
        <p id={labelledBy ? `${labelledBy}-hint` : undefined} className="mt-1.5 text-[13px]" style={{ color: MUTED }}>
          PDF only, up to 5 MB
        </p>
      </div>
      <input ref={inputRef} type="file" accept=".pdf" className="hidden" tabIndex={-1} aria-hidden
        onChange={(e) => validate(e.target.files[0])} />
    </div>
  )
}

/* ─── Modal shell ─── */
function ModalShell({ onClose, labelledBy, className, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(13,15,14,0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={labelledBy}
        className={cn('relative w-full max-w-[400px] rounded-[24px] bg-white p-7 sm:p-8', className)}
        style={{ boxShadow: '0 0 0 1px rgba(13,15,14,0.06), 0 24px 60px -20px rgba(13,15,14,0.35)' }}>
        <button onClick={onClose} aria-label="Close"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full transition-colors hover:bg-[#F4F6F2]"
          style={{ color: MUTED }}>
          <X className="size-4" aria-hidden />
        </button>
        {children}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
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
    <ModalShell onClose={onClose} labelledBy="auth-modal-title">
      <h2 id="auth-modal-title" className="pr-8 text-[24px] font-medium" style={{ color: INK, lineHeight: 1.15, letterSpacing: '-0.03em' }}>
        Sign in to ResumeMax
      </h2>
      <p className="mt-2 text-[15px] leading-[1.55]" style={{ color: MUTED }}>
        Get 5 free resume checks every month.
      </p>

      <Button onClick={signInWithGoogle}
        className="mt-6 h-12 w-full gap-3 rounded-full border border-[#D5D9D3] bg-white text-[15px] font-medium text-[#0D0F0E] hover:bg-[#F4F6F2]">
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="my-5 flex items-center gap-3" aria-hidden>
        <div className="h-px flex-1" style={{ background: LINE }} />
        <span className="text-[13px]" style={{ color: MUTED }}>or use your email</span>
        <div className="h-px flex-1" style={{ background: LINE }} />
      </div>

      {sent ? (
        <div className="rounded-[16px] p-4" style={{ background: TOOLS.resume.tint }} role="status">
          <p className="flex items-center gap-2 text-[15px] font-medium" style={{ color: TOOLS.resume.deep }}>
            <Mail className="size-4" aria-hidden />
            Check your inbox
          </p>
          <p className="mt-1 text-[14px]" style={{ color: TOOLS.resume.deep }}>{email}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <FieldLabel htmlFor="auth-email">Email address</FieldLabel>
          <Input id="auth-email" type="email" autoComplete="email" placeholder="you@college.edu"
            value={email} onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendLink()}
            className={cn(INPUT_CLASS, 'h-12 rounded-[12px]')} />
          <PrimaryButton onClick={sendLink} disabled={sending || !email.trim()}
            className="h-12 w-full disabled:opacity-40">
            {sending ? 'Sending link…' : 'Email me a sign-in link'}
          </PrimaryButton>
        </div>
      )}
    </ModalShell>
  )
}

/* ─── Paywall Modal ─── */
function PaywallModal({ onClose }) {
  return (
    <ModalShell onClose={onClose} labelledBy="paywall-title" className="text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full" style={{ background: TOOLS.cover.tint, color: TOOLS.cover.deep }}>
        <Lock className="size-5" aria-hidden />
      </span>
      <h2 id="paywall-title" className="mt-4 text-[24px] font-medium" style={{ color: INK, lineHeight: 1.15, letterSpacing: '-0.03em' }}>
        Monthly limit reached
      </h2>
      <p className="mt-2 text-[15px] leading-[1.6]" style={{ color: MUTED }}>
        You&apos;ve used your 5 free analyses this month.
        Grab a Pro Pass to keep going, from ₹99.
      </p>
      <PrimaryButton href="/pricing" className="mt-6 h-12 w-full">
        View plans
      </PrimaryButton>
      <button onClick={onClose}
        className="mt-3 rounded-full px-3 py-2 text-[14px] font-medium transition-colors hover:text-[#0D0F0E]"
        style={{ color: MUTED }}>
        Come back next month
      </button>
    </ModalShell>
  )
}

/* ═══════════════════════════════════════════════════════════
   ANALYZE PAGE
═══════════════════════════════════════════════════════════ */
export default function AnalyzePage() {
  const topRef = useRef(null)
  const router = useRouter()
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

  // The Pro routes spend the free use server-side; this only updates the UI.
  const freeLeft = (tool) => usage?.free_pro_left?.[tool] ?? 0
  const canUseTool = (tool) => usage?.plan === 'pro' || freeLeft(tool) > 0
  const markFreeTrialUsed = (tool) => {
    setUsage(prev => prev ? { ...prev, free_pro_left: { ...prev.free_pro_left, [tool]: Math.max(0, (prev.free_pro_left?.[tool] ?? 0) - 1) } } : prev)
  }

  const handleAnalyze = async () => {
    if (!user || !session) { setShowAuthModal(true); return }
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
    const canUsePro = canUseTool('cover')
    if (!canUsePro) { router.push('/pricing'); return }

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
        if (res.status === 403) getUsage(session.access_token).then(setUsage)
      } else {
        setCoverLetter(data.coverLetter)
        if (usage?.plan !== 'pro') markFreeTrialUsed('cover')
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
    const canUsePro = canUseTool('outreach')
    if (!canUsePro) { router.push('/pricing'); return }
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
      if (!res.ok) {
        setOutreachError(data.message || 'Generation failed. Please try again.')
        if (res.status === 403) getUsage(session.access_token).then(setUsage)
      } else {
        setOutreachResult(data)
        if (usage?.plan !== 'pro') markFreeTrialUsed('outreach')
      }
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
    const canUsePro = canUseTool('interview')
    if (!canUsePro) { router.push('/pricing'); return }
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
      if (!res.ok) {
        setInterviewError(data.message || 'Generation failed. Please try again.')
        if (res.status === 403) getUsage(session.access_token).then(setUsage)
      } else {
        setInterviewQuestions(data.questions)
        if (usage?.plan !== 'pro') markFreeTrialUsed('interview')
      }
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
    if (!user || !session) { setShowAuthModal(true); return }
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

  const freeLimit  = 5 + (usage?.bonus_analyses ?? 0)
  const atLimit    = usage?.plan === 'free' && usage?.analyses_used >= freeLimit
  const bothReady  = !!resumeFile && jobDescription.trim().length > 0
  const canAnalyze = bothReady && !loading && !atLimit

  const proStatus = (tool) => {
    if (!usage || usage.plan === 'pro') return null
    const left = freeLeft(tool)
    return left > 0 ? `${left} free ${left === 1 ? 'try' : 'tries'} left` : 'Free tries used'
  }
  const proActionLabel = (tool) => usage?.plan === 'pro' ? 'Generate' : freeLeft(tool) > 0 ? 'Generate for free' : 'Unlock Pro'
  const anyFreeLeft = ['cover', 'outreach', 'interview', 'portfolio'].some((t) => freeLeft(t) > 0)

  return (
    <div ref={topRef} className="rmx min-h-screen bg-white" style={{ color: INK }}>

      {/* ── Toasts ── */}
      {authError && (
        <div role="alert" className="fixed inset-x-0 top-0 z-50 px-4 py-2.5 text-center text-[14px] font-medium"
          style={{ background: ERROR_BG, color: ERROR_TEXT }}>
          Sign-in failed. Your session may have expired, please try again.
        </div>
      )}
      {/* ── Modals ── */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)}
          signInWithGoogle={signInWithGoogle} signInWithEmail={signInWithEmail} />
      )}
      {showPaywall && (
        <PaywallModal onClose={() => setShowPaywall(false)} />
      )}

      {/* ── Navbar ── */}
      <AppNav active="analyze" user={user} usage={usage} onSignOut={signOut} loading={authLoading} />

      {/* ── Main ── */}
      <main className="mx-auto max-w-[1040px] px-5 py-10 sm:px-8 sm:py-14">

        {/* ════ INPUT FORM ════ */}
        {!result && !loading && (
          <div className="anim-fade-up">

            {/* Page header */}
            <div className="max-w-[640px]">
              <ToolTag tool="resume" />
              <h1 className="mt-4 font-medium"
                style={{ color: INK, fontSize: 'clamp(32px, 4.4vw, 48px)', lineHeight: 1.05, letterSpacing: '-0.04em', textWrap: 'balance' }}>
                Check your resume against a job
              </h1>
              <p className="mt-3 text-[17px] leading-[1.6]" style={{ color: MUTED }}>
                Match your resume to any job description in seconds.
              </p>
            </div>

            {/* Step indicator */}
            <div className="mt-7">
              <StepIndicator
                resumeFile={resumeFile}
                jobDescription={jobDescription}
                result={result}
              />
            </div>

            <Stage tool="resume" className="mt-6">
              {/* Two-column inputs */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-5">

                {/* Left — PDF upload */}
                <Surface className="flex flex-col gap-3 p-4 sm:p-5">
                  <p id="resume-label" className="text-[14px] font-medium" style={{ color: INK }}>
                    Your resume (PDF)
                  </p>
                  <PdfUploadZone
                    labelledBy="resume-label"
                    file={resumeFile}
                    onFile={(f, err) => { setResumeFile(f); setFileError(err || '') }}
                    onClear={() => { setResumeFile(null); setFileError('') }}
                  />
                  {fileError && <ErrorNote className="py-2.5 text-[13.5px]">{fileError}</ErrorNote>}
                </Surface>

                {/* Right — Job description */}
                <Surface className="flex flex-col gap-3 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel htmlFor="job-description">Job description</FieldLabel>
                    <span className="text-[13px] tabular-nums" style={{ color: MUTED }} aria-live="polite">
                      {jobDescription.length} / {JD_MAX}
                    </span>
                  </div>
                  <Textarea
                    id="job-description"
                    className={TEXTAREA_CLASS}
                    style={{
                      height: INPUT_HEIGHT,
                      borderColor: jdFocused ? INK : jobDescription.trim().length > 0 ? TOOLS.resume.strong : undefined,
                    }}
                    placeholder="Paste the full job description here…"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    onFocus={() => setJdFocused(true)}
                    onBlur={() => setJdFocused(false)}
                    maxLength={JD_MAX}
                  />
                </Surface>
              </div>

              {/* ── CTA bridge ── */}
              <div className="mt-6 flex flex-col items-center gap-3">
                <PrimaryButton
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  title={atLimit ? "Monthly limit reached. Upgrade to continue." : undefined}
                  className="h-12 min-w-[200px] px-8 text-[16px] disabled:cursor-not-allowed disabled:opacity-40">
                  Analyze resume
                </PrimaryButton>

                {!bothReady && !atLimit && (
                  <p className="text-[13.5px]" style={{ color: TOOLS.resume.deep }}>
                    Add your resume and the job description to continue.
                  </p>
                )}

                {/* Limit warning */}
                {atLimit && (
                  <p className="text-center text-[14px]" style={{ color: ERROR_TEXT }}>
                    Monthly limit reached.{' '}
                    <button onClick={() => setShowPaywall(true)}
                      className="font-medium underline underline-offset-4 hover:no-underline"
                      style={{ color: INK }}>
                      Upgrade for unlimited
                    </button>
                  </p>
                )}

                {/* Error */}
                {error && <ErrorNote className="w-full max-w-[560px]">{error}</ErrorNote>}
              </div>
            </Stage>

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
            <div className="no-print mt-6 mb-8 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderColor: LINE }}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[10px]"
                  style={{ background: TOOLS.resume.tint, color: TOOLS.resume.deep }}>
                  <FileText className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium" style={{ color: INK }}>
                    {resumeFile?.name}
                  </p>
                  <p className="hidden truncate text-[13.5px] sm:block" style={{ color: MUTED }}>
                    {jobDescription.trim().slice(0, 80)}{jobDescription.length > 80 ? '…' : ''}
                  </p>
                </div>
              </div>
              <SecondaryButton onClick={handleReset} className={cn(SMALL_BTN, 'self-start sm:self-auto')}>
                <RotateCcw className="size-4" aria-hidden />
                Start over
              </SecondaryButton>
            </div>

            <AnalysisResults
              result={result}
              previousResult={previousResult}
              comparisonSummary={comparisonSummary}
              reanalyzing={reanalyzing}
            />

            {/* ── Free Pro Trial Banner ── */}
            {usage && usage.plan !== 'pro' && (
              <div className="mt-12 flex flex-col gap-4 rounded-[18px] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                style={anyFreeLeft
                  ? { background: TOOLS.resume.tint }
                  : { background: MIST, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white"
                    style={{ color: anyFreeLeft ? TOOLS.resume.deep : INK }}>
                    {anyFreeLeft ? <Gift className="size-4" aria-hidden /> : <Lock className="size-4" aria-hidden />}
                  </span>
                  <div>
                    <p className="text-[15px] font-medium" style={{ color: anyFreeLeft ? TOOLS.resume.deep : INK }}>
                      {anyFreeLeft
                        ? 'You get 2 free tries of every Pro tool.'
                        : 'Free tries used. Get a Pro Pass to keep going.'}
                    </p>
                    <p className="mt-0.5 text-[13.5px]" style={{ color: anyFreeLeft ? TOOLS.resume.deep : MUTED }}>
                      {anyFreeLeft
                        ? 'Cover letters, cold outreach, interview prep and portfolio review. No card needed.'
                        : 'Plans start at ₹99. One-time payment, no subscription.'}
                    </p>
                  </div>
                </div>
                {!anyFreeLeft && (
                  <PrimaryButton
                    onClick={() => router.push('/pricing')}
                    className="h-10 shrink-0 self-start px-4 text-[14px] sm:self-auto">
                    View plans
                  </PrimaryButton>
                )}
              </div>
            )}

            {/* ── Cover Letter ── */}
            <Stage tool="cover" role="region" className="mt-8 sm:mt-10" aria-labelledby="cover-heading">
              <ToolHeader
                tool="cover"
                id="cover-heading"
                title="Cover letter"
                description="Tailored to this job description using your resume."
                status={proStatus('cover')}
                action={!coverLetterLoading && (
                  <PrimaryButton onClick={handleGenerateCoverLetter} className="h-10 px-4 text-[14px]">
                    {coverLetter ? 'Regenerate' : proActionLabel('cover')}
                  </PrimaryButton>
                )}
              />

              {(coverLetterLoading || coverLetterError || coverLetter) && (
                <div className="mt-6 flex flex-col gap-3">
                  {/* Loading */}
                  {coverLetterLoading && <WorkingNote>Writing your cover letter…</WorkingNote>}

                  {/* Error */}
                  {coverLetterError && <ErrorNote>{coverLetterError}</ErrorNote>}

                  {/* Cover letter output */}
                  {coverLetter && (
                    <Surface className="anim-fade-up overflow-hidden">
                      {/* Toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6"
                        style={{ borderColor: LINE }}>
                        <span className="flex items-center gap-2 text-[13.5px] font-medium" style={{ color: MUTED }}>
                          <FileText className="size-4" style={{ color: TOOLS.cover.deep }} aria-hidden />
                          cover_letter.pdf
                        </span>
                        <div className="flex items-center gap-2">
                          <SecondaryButton onClick={handleCopyCoverLetter} className={SMALL_BTN} aria-live="polite">
                            {coverLetterCopied ? <Check className="size-4" style={{ color: SUCCESS }} aria-hidden /> : <Copy className="size-4" aria-hidden />}
                            {coverLetterCopied ? 'Copied' : 'Copy'}
                          </SecondaryButton>
                          <SecondaryButton
                            onClick={handleDownloadCoverLetter}
                            disabled={coverLetterDownloading}
                            className={cn(SMALL_BTN, 'disabled:opacity-60')}>
                            {coverLetterDownloading ? (
                              <>
                                <Spinner size={14} />
                                Exporting…
                              </>
                            ) : (
                              <>
                                <Download className="size-4" aria-hidden />
                                Download PDF
                              </>
                            )}
                          </SecondaryButton>
                        </div>
                      </div>

                      {/* Letter body */}
                      <div className="px-5 py-6 sm:px-8 sm:py-7">
                        <p className="whitespace-pre-wrap text-[15px] leading-[1.8]" style={{ color: TEXT }}>
                          {coverLetter}
                        </p>
                      </div>
                    </Surface>
                  )}
                </div>
              )}
            </Stage>

            {/* ── Cold Outreach ── */}
            <Stage tool="outreach" role="region" className="mt-6" aria-labelledby="outreach-heading">
              <ToolHeader
                tool="outreach"
                id="outreach-heading"
                title="Cold outreach"
                description="A personalised cold email or LinkedIn DM for this role."
                status={proStatus('outreach')}
                action={!outreachLoading && (
                  <PrimaryButton onClick={handleGenerateOutreach} disabled={!result}
                    className="h-10 px-4 text-[14px] disabled:opacity-40">
                    {outreachResult ? 'Regenerate' : proActionLabel('outreach')}
                  </PrimaryButton>
                )}
              />

              <Surface className="mt-6 p-4 sm:p-5">
                {/* Optional inputs */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="recruiter-name">
                      Recruiter name <span className="font-normal" style={{ color: MUTED }}>(optional)</span>
                    </FieldLabel>
                    <Input
                      id="recruiter-name"
                      type="text"
                      value={recruiterName}
                      onChange={e => setRecruiterName(e.target.value)}
                      placeholder="e.g. Sarah"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="company-name">
                      Company name <span className="font-normal" style={{ color: MUTED }}>(optional)</span>
                    </FieldLabel>
                    <Input
                      id="company-name"
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="e.g. Google"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                {/* Mode tabs */}
                <Tabs value={outreachMode} onValueChange={(v) => setOutreachMode(v)} className="mt-5 gap-0">
                  <TabsList aria-label="Message type" className="h-10 w-full rounded-full bg-[#F1F3EF] p-1 sm:w-fit">
                    <TabsTrigger value="email"
                      className="rounded-full px-4 text-[14px] text-[#646A66] data-[active]:bg-white data-[active]:text-[#0D0F0E] data-[active]:shadow-[0_1px_2px_rgba(13,15,14,0.08)]">
                      <Mail aria-hidden />
                      Cold email
                    </TabsTrigger>
                    <TabsTrigger value="dm"
                      className="rounded-full px-4 text-[14px] text-[#646A66] data-[active]:bg-white data-[active]:text-[#0D0F0E] data-[active]:shadow-[0_1px_2px_rgba(13,15,14,0.08)]">
                      <MessageSquare aria-hidden />
                      LinkedIn DM
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </Surface>

              {(outreachLoading || outreachError || outreachResult) && (
                <div className="mt-3 flex flex-col gap-3">
                  {/* Loading */}
                  {outreachLoading && <WorkingNote>Writing your outreach message…</WorkingNote>}

                  {/* Error */}
                  {outreachError && <ErrorNote>{outreachError}</ErrorNote>}

                  {/* Output */}
                  {outreachResult && (
                    <Surface className="anim-fade-up overflow-hidden">
                      {/* Toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6"
                        style={{ borderColor: LINE }}>
                        <div className="flex items-center gap-2">
                          {outreachMode === 'email'
                            ? <Mail className="size-4" style={{ color: TOOLS.outreach.deep }} aria-hidden />
                            : <MessageSquare className="size-4" style={{ color: TOOLS.outreach.deep }} aria-hidden />}
                          <span className="text-[13.5px] font-medium" style={{ color: MUTED }}>
                            {outreachMode === 'email' ? 'Cold email' : 'LinkedIn DM'}
                          </span>
                          {outreachMode === 'dm' && (
                            <span className="rounded-full px-2 py-0.5 text-[12px] font-medium tabular-nums"
                              style={outreachResult.linkedInDm.length > 280
                                ? { background: ERROR_BG, color: ERROR_TEXT }
                                : { background: TOOLS.resume.tint, color: TOOLS.resume.deep }}>
                              {outreachResult.linkedInDm.length} chars
                            </span>
                          )}
                        </div>
                        <SecondaryButton onClick={handleCopyOutreach} className={SMALL_BTN} aria-live="polite">
                          {outreachCopied ? <Check className="size-4" style={{ color: SUCCESS }} aria-hidden /> : <Copy className="size-4" aria-hidden />}
                          {outreachCopied ? 'Copied' : 'Copy'}
                        </SecondaryButton>
                      </div>

                      {/* Body */}
                      <div className="px-5 py-6 sm:px-8 sm:py-7">
                        {outreachMode === 'email' ? (
                          <>
                            <p className="mb-4 border-b pb-4 text-[14px]" style={{ color: MUTED, borderColor: LINE }}>
                              Subject: <span className="font-medium" style={{ color: INK }}>
                                {outreachResult.coldEmail.subject}
                              </span>
                            </p>
                            <p className="whitespace-pre-wrap text-[15px] leading-[1.8]" style={{ color: TEXT }}>
                              {outreachResult.coldEmail.body}
                            </p>
                          </>
                        ) : (
                          <p className="whitespace-pre-wrap text-[15px] leading-[1.8]" style={{ color: TEXT }}>
                            {outreachResult.linkedInDm}
                          </p>
                        )}
                      </div>
                    </Surface>
                  )}
                </div>
              )}
            </Stage>

            {/* ── Interview Prep ── */}
            <Stage tool="interview" role="region" className="no-print mt-6" aria-labelledby="interview-heading">
              <ToolHeader
                tool="interview"
                id="interview-heading"
                title="Interview prep"
                description="Practice questions tailored to this role, with tips from your own resume."
                status={proStatus('interview')}
                action={!interviewLoading && (
                  <PrimaryButton onClick={handleGenerateInterviewPrep} disabled={!result}
                    className="h-10 px-4 text-[14px] disabled:cursor-not-allowed disabled:opacity-40">
                    {interviewQuestions ? 'Regenerate' : 'Generate questions'}
                  </PrimaryButton>
                )}
              />

              {(interviewLoading || interviewError || interviewQuestions) && (
                <div className="mt-6 flex flex-col gap-3">
                  {/* Loading */}
                  {interviewLoading && <WorkingNote>Generating your questions…</WorkingNote>}

                  {/* Error */}
                  {interviewError && <ErrorNote>{interviewError}</ErrorNote>}

                  {/* Question Cards */}
                  {interviewQuestions && (
                    <ol className="anim-fade-up flex flex-col gap-3">
                      {interviewQuestions.map((q, i) => {
                        const catColor = q.category === 'Behavioral'
                          ? { bg: TOOLS.interview.tint, color: TOOLS.interview.deep }
                          : q.category === 'Technical'
                          ? { bg: '#E3EEFF', color: '#1E40AF' }
                          : { bg: TOOLS.cover.tint, color: TOOLS.cover.deep }
                        return (
                          <li key={i}>
                            <Surface className="p-5 sm:p-6">
                              {/* Category + number */}
                              <div className="mb-3 flex items-center gap-2">
                                <span className="text-[13px] font-medium tabular-nums" style={{ color: MUTED }}>Q{i + 1}</span>
                                <span className="rounded-full px-2.5 py-0.5 text-[12px] font-medium"
                                  style={{ background: catColor.bg, color: catColor.color }}>
                                  {q.category}
                                </span>
                              </div>
                              {/* Question */}
                              <p className="text-[16px] font-medium" style={{ color: INK, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                                {q.question}
                              </p>
                              {/* Tip */}
                              <div className="mt-4 flex gap-3 rounded-[12px] p-4" style={{ background: MIST }}>
                                <Lightbulb className="mt-0.5 size-4 shrink-0" style={{ color: TOOLS.interview.strong }} aria-hidden />
                                <p className="text-[14px] leading-[1.6]" style={{ color: TEXT }}>
                                  <span className="font-medium" style={{ color: INK }}>Tip: </span>
                                  {q.tip}
                                </p>
                              </div>
                            </Surface>
                          </li>
                        )
                      })}
                    </ol>
                  )}
                </div>
              )}
            </Stage>

            {/* ── Re-analyze Panel ── */}
            <div className="no-print mt-10">
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
                aria-expanded={showReanalyzePanel}
                aria-controls="reanalyze-panel"
                className="flex w-full items-center justify-between gap-4 rounded-[18px] bg-white px-5 py-4 text-left transition-colors hover:bg-[#F4F6F2]"
                style={{ boxShadow: `inset 0 0 0 1px ${showReanalyzePanel ? TOOLS.resume.strong : LINE}` }}>
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full"
                    style={{ background: TOOLS.resume.tint, color: TOOLS.resume.deep }}>
                    <RefreshCw className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[15px] font-medium" style={{ color: INK }}>
                      Test your updates
                    </p>
                    <p className="text-[13.5px]" style={{ color: MUTED }}>
                      Upload an improved resume and re-run the analysis to see your progress.
                    </p>
                  </div>
                </div>
                <ChevronDown className="size-5 shrink-0 transition-transform duration-200"
                  style={{ transform: showReanalyzePanel ? 'rotate(180deg)' : 'none', color: MUTED }} aria-hidden />
              </button>

              {/* Expanded panel */}
              {showReanalyzePanel && (
                <Stage tool="resume" id="reanalyze-panel" className="anim-fade-up mt-3">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-5">

                    {/* Left — new PDF upload */}
                    <Surface className="flex flex-col gap-3 p-4 sm:p-5">
                      <p id="reanalyze-resume-label" className="text-[14px] font-medium" style={{ color: INK }}>
                        Updated resume
                      </p>
                      <PdfUploadZone
                        labelledBy="reanalyze-resume-label"
                        file={reanalyzeFile}
                        onFile={(f, err) => { if (!err) setReanalyzeFile(f) }}
                        onClear={() => setReanalyzeFile(null)}
                      />
                      {reanalyzeFile && reanalyzeFile !== resumeFile && (
                        <p className="flex items-center gap-1.5 text-[13.5px] font-medium" style={{ color: TOOLS.resume.deep }}>
                          <Check className="size-3.5" strokeWidth={3} aria-hidden />
                          New file selected. It will replace the previous one.
                        </p>
                      )}
                    </Surface>

                    {/* Right — editable JD */}
                    <Surface className="flex flex-col gap-3 p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3">
                        <FieldLabel htmlFor="reanalyze-jd">Job description</FieldLabel>
                        <button
                          onClick={() => setReanalyzeJd(jobDescription)}
                          className="rounded-full px-2 py-1 text-[13px] font-medium underline-offset-4 transition-colors hover:underline"
                          style={{ color: MUTED }}>
                          Reset
                        </button>
                      </div>
                      <Textarea
                        id="reanalyze-jd"
                        className={TEXTAREA_CLASS}
                        style={{
                          height: INPUT_HEIGHT,
                          borderColor: reanalyzeJdFocused ? INK : undefined,
                        }}
                        value={reanalyzeJd}
                        onChange={(e) => setReanalyzeJd(e.target.value)}
                        onFocus={() => setReanalyzeJdFocused(true)}
                        onBlur={() => setReanalyzeJdFocused(false)}
                        maxLength={JD_MAX}
                        placeholder="Edit the job description if needed…"
                      />
                    </Surface>
                  </div>

                  {/* Re-analyze CTA */}
                  <div className="mt-6 flex items-center justify-center">
                    <PrimaryButton
                      onClick={handleReanalyze}
                      disabled={reanalyzing || !reanalyzeFile}
                      className="h-12 min-w-[220px] px-8 text-[16px] disabled:cursor-not-allowed disabled:opacity-40">
                      {reanalyzing ? 'Re-analyzing…' : 'Re-analyze'}
                    </PrimaryButton>
                  </div>
                </Stage>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  )
}
