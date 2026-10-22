'use client'
import { useState, useEffect, useId } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getUsage } from '@/lib/api'
import AppNav from '@/components/landing/AppNav'
import FaqSection from '@/components/landing/sections/FaqSection'
import { Surface, PrimaryButton, ToolTag } from '@/components/landing/primitives'
import { INK, LINE, MIST, MUTED, TEXT, TOOLS } from '@/components/landing/tokens'
import { cn } from '@/lib/utils'
import { Dots } from '@/components/landing/Loader'

const PASSES = [
  {
    id: 'sprint',
    days: 30,
    amount: 99,
    duration: '30 days of access',
    name: '1-Month Sprint',
    price: '₹99',
    highlight: false,
    blurb: 'One focused month of job hunting.',
  },
  {
    id: 'season',
    days: 90,
    amount: 249,
    duration: '90 days of access',
    name: 'Placement Season',
    price: '₹249',
    highlight: true,
    blurb: 'Covers a full placement season, start to offer.',
  },
  {
    id: 'grind',
    days: 180,
    amount: 499,
    duration: '180 days of access',
    name: 'Off-Campus Grind',
    price: '₹499',
    highlight: false,
    blurb: 'Six months for a longer off-campus search.',
  },
]
const DEFAULT_PASS = 1 // 90 days

// Every pass has the same tools; only the length changes.
const PRO_FEATURES = [
  { tool: null, label: 'Unlimited resume checks and bullet rewrites' },
  { tool: 'cover', label: 'Cover letters you can download as PDF' },
  { tool: 'outreach', label: 'Cold emails and LinkedIn DMs' },
  { tool: 'interview', label: 'Interview questions from your own resume' },
  { tool: 'portfolio', label: 'GitHub and portfolio review' },
]

const titleStyle = { color: INK, letterSpacing: '-0.02em' }

function Price({ amount }) {
  return (
    <span
      className="whitespace-nowrap font-medium tabular-nums"
      style={{ color: INK, fontSize: 'clamp(44px, 6vw, 60px)', lineHeight: 1, letterSpacing: '-0.04em' }}
    >
      <span style={{ fontSize: '0.46em', verticalAlign: '0.75em', letterSpacing: 0, marginRight: '0.08em' }}>₹</span>
      {amount}
    </span>
  )
}

function Feature({ tool, children }) {
  return (
    <li className="flex gap-3 text-[15px] leading-[1.5]" style={{ color: TEXT }}>
      <span aria-hidden className="flex h-[22.5px] w-4 shrink-0 items-center justify-center">
        {tool
          ? <span className="size-2.5 rounded-full" style={{ background: TOOLS[tool].strong }} />
          : <Check className="size-4" strokeWidth={2.25} style={{ color: INK }} />}
      </span>
      <span>{children}</span>
    </li>
  )
}

function PassPicker({ value, onChange, name, disabled }) {
  return (
    <fieldset className="w-full min-w-0 sm:w-[300px]" disabled={disabled}>
      <legend className="sr-only">Pass length</legend>
      <div className="relative grid h-11 grid-cols-3 rounded-full p-1" style={{ background: '#F1F3EF' }}>
        <span
          aria-hidden
          className="absolute bottom-1 left-1 top-1 rounded-full bg-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            width: 'calc((100% - 8px) / 3)',
            transform: `translateX(${value * 100}%)`,
            boxShadow: '0 0 0 1px rgba(13,15,14,0.06), 0 1px 2px rgba(13,15,14,0.08), 0 2px 6px -2px rgba(13,15,14,0.12)',
          }}
        />
        {PASSES.map((p, i) => {
          const checked = i === value
          return (
            <label
              key={p.id}
              className={cn(
                'relative flex cursor-pointer select-none items-center justify-center rounded-full px-2 text-[14px] font-medium transition-colors',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#0D0F0E]',
                checked ? 'text-[#0D0F0E]' : 'text-[#646A66] hover:text-[#0D0F0E]'
              )}
            >
              <input
                type="radio"
                name={name}
                value={p.id}
                checked={checked}
                onChange={() => onChange(i)}
                className="sr-only"
              />
              {p.days} days
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

const MONTHS = 6
const fmt = (d, opts) => d.toLocaleDateString('en-GB', opts)

function PassTimeline({ days }) {
  const [today, setToday] = useState(null)
  useEffect(() => setToday(new Date()), [])
  const filled = Math.round(days / 30)
  const months = Array.from({ length: MONTHS }, (_, i) =>
    today ? fmt(new Date(today.getFullYear(), today.getMonth() + i, 1), { month: 'short' }) : ''
  )
  const end = today ? new Date(today.getTime() + days * 86400000) : null
  const deep = TOOLS.resume.deep

  return (
    <div className="rounded-[16px] p-5" style={{ background: TOOLS.resume.tint }}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[14px] font-medium" style={{ color: deep }}>Your pass</p>
        <p className="text-[13px]" style={{ color: deep }}>{days} days</p>
      </div>
      <div className="mt-4 grid grid-cols-6 gap-1.5" aria-hidden>
        {months.map((m, i) => (
          <div key={i}>
            <div
              className="h-2.5 rounded-full transition-colors duration-300"
              style={{ background: i < filled ? TOOLS.resume.strong : 'rgba(6,95,59,0.14)' }}
            />
            <p className="mt-1.5 text-[11.5px]" style={{ color: deep, opacity: i < filled ? 1 : 0.55 }}>{m || ' '}</p>
          </div>
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-[13.5px]" style={{ borderColor: 'rgba(6,95,59,0.15)' }}>
        <div>
          <dt style={{ color: deep, opacity: 0.75 }}>Starts</dt>
          <dd className="mt-0.5 font-medium" style={{ color: deep }}>When you pay</dd>
        </div>
        <div>
          <dt style={{ color: deep, opacity: 0.75 }}>Ends</dt>
          <dd className="mt-0.5 font-medium" style={{ color: deep }}>
            {end ? fmt(end, { day: 'numeric', month: 'short', year: 'numeric' }) : ' '}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-[12.5px] leading-[1.5]" style={{ color: deep, opacity: 0.8 }}>
        No auto-renew. It simply ends, and your free checks carry on.
      </p>
    </div>
  )
}

export default function PricingPage() {
  const { user, session, loading, signOut } = useAuth()
  const router = useRouter()
  const [activeLoading, setActiveLoading] = useState(null)
  const [isPro, setIsPro]                 = useState(false)
  const [successPlan, setSuccessPlan]     = useState(null)
  const [usage, setUsage]                 = useState(null)
  const [index, setIndex]                 = useState(DEFAULT_PASS)
  const groupName = useId()

  useEffect(() => {
    if (!session?.access_token) return
    getUsage(session.access_token).then(d => {
      if (d) setUsage(d)
      if (d?.plan === 'pro') setIsPro(true)
    }).catch(() => {})
  }, [session])

  const handleBuy = async (planId) => {
    if (!session) { router.push('/login'); return }
    setActiveLoading(planId)
    try {
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan: planId }),
      })
      const order = await res.json()
      if (!res.ok) { setActiveLoading(null); return }
      const pass = PASSES.find(p => p.id === planId)
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount, currency: order.currency, order_id: order.order_id,
        name: 'ResumeMax', description: pass?.name || 'Pro Pass',
        prefill: { email: user?.email }, theme: { color: '#ffc174' },
        handler: async (response) => {
          try {
            const v  = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
              body: JSON.stringify(response),
            })
            const vd = await v.json()
            if (vd.success) { setIsPro(true); setSuccessPlan(planId) }
          } catch { /* silent */ }
          setActiveLoading(null)
        },
        modal: { ondismiss: () => setActiveLoading(null) },
      })
      rzp.open()
    } catch { setActiveLoading(null) }
  }

  const pass      = PASSES[index]
  const daily     = (pass.amount / pass.days).toFixed(2)
  const isActive  = isPro || successPlan === pass.id
  const isLoading = activeLoading === pass.id
  const boughtPass = PASSES.find(p => p.id === successPlan)
  const navUsage  = usage ? (isPro ? { ...usage, plan: 'pro' } : usage) : (isPro ? { plan: 'pro' } : null)

  return (
    <div className="rmx min-h-screen bg-white">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <AppNav active="pricing" user={user} usage={navUsage} onSignOut={signOut} loading={loading} />

      <main className="mx-auto max-w-[1080px] px-4 pb-20 pt-12 sm:px-8 sm:pt-16">
        <section aria-labelledby="pricing-title">
          <div className="max-w-[720px]">
            <h1
              id="pricing-title"
              className="font-medium"
              style={{ color: INK, fontSize: 'clamp(32px, 4.6vw, 54px)', lineHeight: 1.04, letterSpacing: '-0.035em', textWrap: 'balance' }}
            >
              Pick your Pro Pass
            </h1>
            <p className="mt-5 max-w-[580px] text-[17px] leading-[1.6]" style={{ color: MUTED }}>
              One payment unlocks unlimited checks and the four Pro tools for 30, 90 or 180 days. Your 5 free checks a
              month stay either way.
            </p>
          </div>

          {successPlan && (
            <div
              role="status"
              className="mt-8 flex items-start gap-3 rounded-[16px] px-5 py-4 text-[15px] leading-[1.5]"
              style={{ background: TOOLS.resume.tint, color: TOOLS.resume.deep }}
            >
              <Check className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} aria-hidden />
              <span>
                Payment received. Your {boughtPass?.name} pass is active.{' '}
                <Link href="/analyze" className="font-medium underline underline-offset-2">Go to your dashboard</Link>
              </span>
            </div>
          )}

          <div className="mt-10 flex flex-col rounded-[28px] p-1.5 sm:mt-12 sm:p-2" style={{ background: MIST }}>
            <Surface className="flex-1 rounded-[20px] p-5 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-[20px] font-medium" style={titleStyle}>Pro Pass</h2>
                <PassPicker value={index} onChange={setIndex} name={groupName} disabled={activeLoading !== null} />
              </div>

              <div className="mt-7 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start md:gap-10">
                <div>
                  <div className="flex min-h-7 flex-wrap items-center gap-2.5">
                    <span className="text-[18px] font-medium" style={{ color: INK, letterSpacing: '-0.015em' }}>
                      {pass.name}
                    </span>
                    {pass.highlight && (
                      <span className="inline-flex h-[22px] items-center rounded-full bg-[#0D0F0E] px-2.5 text-[12px] font-medium text-white">
                        Best value
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[14.5px] leading-[1.5]" style={{ color: MUTED }}>{pass.blurb}</p>

                  <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <Price amount={pass.amount} />
                    <span className="text-[15px]" style={{ color: MUTED }}>for {pass.days} days</span>
                  </div>
                  <p className="mt-2 text-[15px] leading-[1.5]" style={{ color: TEXT }}>
                    One-time payment, about ₹{daily} a day
                  </p>

                  <p className="sr-only" aria-live="polite">
                    {`${pass.name} pass: ${pass.price} for ${pass.days} days, about ₹${daily} a day.`}
                  </p>

                  {isActive ? (
                    <div
                      className="mt-6 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium sm:w-auto sm:min-w-[272px]"
                      style={{ background: TOOLS.resume.tint, color: TOOLS.resume.deep }}
                    >
                      <Check className="size-4" strokeWidth={2.5} aria-hidden />
                      Your Pro Pass is active
                    </div>
                  ) : (
                    <PrimaryButton
                      type="button"
                      onClick={() => handleBuy(pass.id)}
                      disabled={activeLoading !== null || loading}
                      aria-busy={isLoading || undefined}
                      className="mt-6 h-auto min-h-[44px] w-full whitespace-normal px-4 py-2.5 text-center leading-snug disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[272px] sm:px-6"
                    >
                      {isLoading ? <>Opening payment <Dots /></> : `Pay ${pass.price} with Razorpay`}
                    </PrimaryButton>
                  )}
                  {!isActive && !loading && !user && (
                    <p className="mt-3 text-[13.5px]" style={{ color: MUTED }}>
                      You will be asked to sign in first.
                    </p>
                  )}
                </div>

                <PassTimeline days={pass.days} />
              </div>

              <ul className="mt-8 grid gap-x-6 gap-y-3 border-t pt-6 sm:grid-cols-2" style={{ borderColor: LINE }}>
                <Feature>Everything in Free</Feature>
                {PRO_FEATURES.map(({ tool, label }) => (
                  <Feature key={label} tool={tool}>{label}</Feature>
                ))}
              </ul>
            </Surface>

            <p className="px-5 py-3.5 text-[13.5px] leading-[1.55] sm:px-8 sm:py-4" style={{ color: MUTED }}>
              One-time payment through Razorpay. No subscription, no auto-renew. Every pass has the same tools; only
              the length changes.
            </p>
          </div>

          <div
            className="mt-5 flex flex-col gap-3 rounded-[20px] border p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"
            style={{ borderColor: LINE }}
          >
            <div>
              <ToolTag tool="resume" />
              <p className="mt-1.5 text-[15px] leading-[1.5]" style={{ color: TEXT }}>
                Not ready to pay? You get 5 free resume checks every month, plus 2 free tries of every Pro tool.
              </p>
            </div>
            <Link
              href="/analyze"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-[#D5D9D3] bg-white px-5 text-[15px] font-medium text-[#0D0F0E] transition-colors hover:bg-[#F4F6F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D0F0E]"
            >
              Start free
            </Link>
          </div>
        </section>

        <div className="mt-20 sm:mt-28">
          <FaqSection />
        </div>
      </main>
    </div>
  )
}
