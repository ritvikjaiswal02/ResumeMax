'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Mail } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/landing/SiteNav'
import { PrimaryButton, Stage, Surface } from '@/components/landing/primitives'
import { INK, LINE, MUTED, TEXT, TOOLS, TOOL_ORDER } from '@/components/landing/tokens'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

const PERKS = [
  '5 resume checks every month, free',
  'Every check saved to your history',
  '2 free tries of every Pro tool',
  'Re-check against the same job to see your score move',
]

function AccountPreview() {
  return (
    <Stage tool="resume" className="flex h-full flex-col justify-center p-6 sm:p-10 lg:p-12">
      <h2 className="max-w-[420px] font-medium" style={{ color: INK, fontSize: 'clamp(26px, 2.6vw, 34px)', lineHeight: 1.1, letterSpacing: '-0.035em' }}>
        Your account is where the whole job hunt lives.
      </h2>

      <Surface className="mt-8 max-w-[440px] p-5">
        <div className="flex items-center gap-4">
          <div className="relative grid size-16 shrink-0 place-items-center">
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#EEF0EC" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke={TOOLS.resume.strong} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${0.86 * 97.4} 97.4`} />
            </svg>
            <span className="text-[19px] font-medium" style={{ color: INK }}>86</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium" style={{ color: INK }}>Frontend Developer, fresher</p>
            <p className="text-[13.5px]" style={{ color: MUTED }}>Kestrel Pay, checked today</p>
            <p className="mt-1 text-[13px] font-medium" style={{ color: TOOLS.resume.deep }}>Up 34 points since your first check</p>
          </div>
        </div>
        <ul className="mt-5 space-y-2.5 border-t pt-4" style={{ borderColor: LINE }}>
          {PERKS.map((p) => (
            <li key={p} className="flex gap-2.5 text-[14px] leading-snug" style={{ color: TEXT }}>
              <Check className="mt-0.5 size-4 shrink-0" style={{ color: TOOLS.resume.strong }} aria-hidden />
              {p}
            </li>
          ))}
        </ul>
      </Surface>

      <p className="mt-8 text-[14px]" style={{ color: TOOLS.resume.deep }}>Pro tools, whenever you need them</p>
      <ul className="mt-3 flex max-w-[460px] flex-wrap gap-2">
        {TOOL_ORDER.filter((id) => TOOLS[id].pro).map((id) => (
          <li key={id} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[13px] font-medium" style={{ color: TOOLS[id].deep }}>
            <span aria-hidden className="size-2 rounded-full" style={{ background: TOOLS[id].strong }} />
            {TOOLS[id].name}
          </li>
        ))}
      </ul>
    </Stage>
  )
}

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithEmail } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [ref, setRef] = useState(null)

  useEffect(() => {
    if (user) router.replace('/analyze')
  }, [user, router])

  useEffect(() => {
    const stored = localStorage.getItem('rmx_ref')
    if (stored) setRef(stored)
  }, [])

  const handleMagicLink = async (e) => {
    e?.preventDefault()
    if (!email.trim() || sending) return
    setSending(true)
    await signInWithEmail(email.trim(), ref)
    setSent(true)
    setSending(false)
  }

  return (
    <div className="rmx min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1240px] grid-cols-1 gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
        <div className="flex flex-col">
          <header className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5" aria-label="ResumeMax home">
              <LogoMark />
              <span className="text-[17px] font-semibold tracking-[-0.02em]" style={{ color: INK }}>ResumeMax</span>
            </Link>
            <Link href="/pricing" className="rounded-full px-3 py-2 text-[14.5px] font-medium text-[#646A66] transition-colors hover:text-[#0D0F0E]">
              Pricing
            </Link>
          </header>

          <main className="flex flex-1 items-center py-12 lg:py-0">
            <div className="w-full max-w-[400px] lg:mx-auto">
              <h1 className="font-medium" style={{ color: INK, fontSize: 'clamp(32px, 3.4vw, 42px)', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
                Sign in to ResumeMax
              </h1>
              <p className="mt-3 text-[16px] leading-[1.6]" style={{ color: MUTED }}>
                New here? Signing in creates your account, with 5 free resume checks every month.
              </p>

              <Button
                onClick={() => signInWithGoogle(ref)}
                className="mt-8 h-12 w-full gap-3 rounded-full border border-[#D5D9D3] bg-white text-[15px] font-medium text-[#0D0F0E] hover:bg-[#F4F6F2]"
              >
                <GoogleIcon />
                Continue with Google
              </Button>

              <div className="my-6 flex items-center gap-3" aria-hidden>
                <div className="h-px flex-1" style={{ background: LINE }} />
                <span className="text-[13px]" style={{ color: MUTED }}>or use your email</span>
                <div className="h-px flex-1" style={{ background: LINE }} />
              </div>

              {sent ? (
                <div className="rounded-[16px] p-5" style={{ background: TOOLS.resume.tint }} role="status">
                  <div className="flex items-center gap-2.5">
                    <Mail className="size-5" style={{ color: TOOLS.resume.deep }} aria-hidden />
                    <p className="text-[15px] font-medium" style={{ color: TOOLS.resume.deep }}>Check your inbox</p>
                  </div>
                  <p className="mt-2 text-[14px] leading-[1.55]" style={{ color: TOOLS.resume.deep }}>
                    We sent a sign-in link to <span className="font-medium">{email}</span>. Open it on this device to continue.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSent(false) }}
                    className="mt-3 text-[14px] font-medium underline underline-offset-4"
                    style={{ color: TOOLS.resume.deep }}
                  >
                    Use a different email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMagicLink}>
                  <Label htmlFor="email" className="text-[14px] font-medium" style={{ color: INK }}>Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 h-12 rounded-[12px] border-[#D5D9D3] bg-white px-4 text-[15px] text-[#0D0F0E] placeholder:text-[#9AA09C] focus-visible:border-[#0D0F0E] focus-visible:ring-0"
                  />
                  <PrimaryButton type="submit" disabled={sending || !email.trim()} className="mt-4 h-12 w-full disabled:opacity-40">
                    {sending ? 'Sending link…' : 'Email me a sign-in link'}
                  </PrimaryButton>
                </form>
              )}

              <Link href="/" className="mt-8 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#646A66] transition-colors hover:text-[#0D0F0E]">
                <ArrowLeft className="size-4" aria-hidden />
                Back to home
              </Link>
            </div>
          </main>
        </div>

        <div className="hidden lg:block">
          <AccountPreview />
        </div>
      </div>
    </div>
  )
}
