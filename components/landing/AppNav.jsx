'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, Gift, LogOut, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoMark } from './SiteNav'
import { PrimaryButton } from './primitives'
import { INK, LINE, MUTED, TOOLS } from './tokens'

const LINKS = [
  { id: 'analyze', href: '/analyze', label: 'Check resume' },
  { id: 'history', href: '/history', label: 'History' },
  { id: 'portfolio', href: '/portfolio', label: 'Portfolio review' },
  { id: 'pricing', href: '/pricing', label: 'Pricing' },
]

function UsagePill({ usage }) {
  if (!usage) return null
  if (usage.plan === 'pro') {
    return (
      <span className="hidden items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium sm:inline-flex" style={{ background: TOOLS.resume.tint, color: TOOLS.resume.deep }}>
        <Sparkles className="size-3.5" aria-hidden />
        Pro
      </span>
    )
  }
  const limit = 5 + (usage.bonus_analyses ?? 0)
  const left = Math.max(0, limit - (usage.analyses_used ?? 0))
  const low = left <= 1
  return (
    <span
      className="hidden rounded-full px-3 py-1 text-[13px] font-medium tabular-nums sm:inline-flex"
      style={low ? { background: '#FDE8E7', color: '#B42318' } : { background: '#F1F3EF', color: '#3B403D' }}
    >
      {left} of {limit} free checks left
    </span>
  )
}

function AccountMenu({ user, usage, onSignOut }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const copyReferral = async () => {
    if (!usage?.referral_code) return
    try {
      await navigator.clipboard.writeText(`https://resumemax.in?ref=${usage.referral_code}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const item = 'flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left text-[14px] font-medium transition-colors hover:bg-[#F4F6F2]'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="grid size-9 place-items-center rounded-full text-[14px] font-semibold text-white"
        style={{ background: INK }}
      >
        {user.email?.[0]?.toUpperCase() ?? '?'}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-64 rounded-[16px] bg-white p-1.5"
          style={{ boxShadow: '0 0 0 1px rgba(13,15,14,0.08), 0 16px 36px -12px rgba(13,15,14,0.25)' }}
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-[14px] font-medium" style={{ color: INK }}>{user.email}</p>
            <p className="mt-0.5 text-[13px]" style={{ color: MUTED }}>{usage?.plan === 'pro' ? 'Pro Pass' : 'Free plan'}</p>
          </div>
          <div className="my-1 h-px" style={{ background: LINE }} />
          {usage?.plan !== 'pro' && (
            <Link href="/pricing" role="menuitem" className={item} style={{ color: INK }} onClick={() => setOpen(false)}>
              <Sparkles className="size-4" aria-hidden /> Get a Pro Pass
            </Link>
          )}
          {usage?.referral_code && (
            <button role="menuitem" onClick={copyReferral} className={item} style={{ color: INK }}>
              {copied ? <Check className="size-4" aria-hidden /> : <Gift className="size-4" aria-hidden />}
              {copied ? 'Invite link copied' : 'Copy invite link'}
            </button>
          )}
          <button role="menuitem" onClick={() => { setOpen(false); onSignOut?.() }} className={item} style={{ color: '#B42318' }}>
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Shared top bar for signed-in app pages.
 * Props: active ('analyze' | 'history' | 'portfolio' | 'pricing'), user, usage (from /api/usage), onSignOut, loading.
 */
export default function AppNav({ active, user, usage, onSignOut, loading }) {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-[#E3E6E1] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="ResumeMax home">
            <LogoMark />
            <span className="hidden text-[17px] font-semibold tracking-[-0.02em] sm:inline" style={{ color: INK }}>ResumeMax</span>
          </Link>
          <nav aria-label="App" className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
            {LINKS.filter((l) => user || l.id === 'pricing' || l.id === 'analyze').map((l) => (
              <Link
                key={l.id}
                href={l.href}
                aria-current={active === l.id ? 'page' : undefined}
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors',
                  active === l.id ? 'bg-[#F1F3EF] text-[#0D0F0E]' : 'text-[#646A66] hover:text-[#0D0F0E]'
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {loading ? null : user ? (
            <>
              <UsagePill usage={usage} />
              <AccountMenu user={user} usage={usage} onSignOut={onSignOut} />
            </>
          ) : (
            <PrimaryButton href="/login" className="h-9 px-4 text-[14px]">Sign in</PrimaryButton>
          )}
        </div>
      </div>
    </header>
  )
}
