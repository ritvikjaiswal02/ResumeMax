'use client'

import { useEffect, useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PrimaryButton, SecondaryButton, Surface, ToolTag, useReducedMotion } from '@/components/landing/primitives'
import { INK, LINE, MIST, MUTED, TEXT, TOOLS } from '@/components/landing/tokens'
import { cn } from '@/lib/utils'

const PASSES = [
  { id: 'sprint', days: 30, name: '1-Month Sprint', price: 99 },
  { id: 'season', days: 90, name: 'Placement Season', price: 249, best: true },
  { id: 'grind', days: 180, name: 'Off-Campus Grind', price: 499 },
]
const DEFAULT_PASS = 1 // 90 days

const FREE_FEATURES = [
  'ATS score out of 100 for each job',
  'Missing keywords from the job post',
  'Rewritten bullet points',
  'Formatting checks',
  'Every check saved to your history',
  '2 free tries of every Pro tool',
]

const PRO_TOOLS = [
  { tool: 'cover', label: 'Cover letters you can download as PDF' },
  { tool: 'outreach', label: 'Cold emails and LinkedIn DMs' },
  { tool: 'interview', label: 'Interview questions from your own resume' },
  { tool: 'portfolio', label: 'GitHub and portfolio review' },
]

const headingStyle = {
  color: INK,
  fontSize: 'clamp(32px, 4.4vw, 52px)',
  lineHeight: 1.04,
  letterSpacing: '-0.035em',
  textWrap: 'balance',
}
const titleStyle = { color: INK, letterSpacing: '-0.02em' }

const perDayCost = (pass) => (pass.price / pass.days).toFixed(2)

// Big price with a smaller, raised rupee sign. Same size in both plans so the rows line up.
function Price({ amount }) {
  return (
    <span
      className="whitespace-nowrap font-medium tabular-nums"
      style={{ color: INK, fontSize: 'clamp(44px, 5vw, 56px)', lineHeight: 1, letterSpacing: '-0.04em' }}
    >
      <span style={{ fontSize: '0.46em', verticalAlign: '0.75em', letterSpacing: 0, marginRight: '0.08em' }}>₹</span>
      {amount}
    </span>
  )
}

const tick = <Check className="size-4" strokeWidth={2.25} style={{ color: INK }} />

function ToolDot({ tool }) {
  return <span className="size-2.5 rounded-full" style={{ background: TOOLS[tool].strong }} />
}

function Feature({ marker, children }) {
  return (
    <li className="flex gap-3 text-[15px] leading-[1.5]" style={{ color: TEXT }}>
      <span aria-hidden className="flex h-[22.5px] w-4 shrink-0 items-center justify-center">
        {marker}
      </span>
      <span>{children}</span>
    </li>
  )
}

// Outgoing and incoming values share one grid cell, so nothing around them moves mid-animation.
// `roll` adds a small vertical slide in the direction of the change (longer pass = rolls up).
function Swap({ id, dir, roll = false, className, children }) {
  const reduce = useReducedMotion()
  const distance = roll && !reduce ? 10 : 0
  return (
    <div className={cn('grid', className)}>
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={id}
          custom={dir}
          variants={{
            enter: (d) => ({ opacity: 0, y: d * distance }),
            center: { opacity: 1, y: 0 },
            exit: (d) => ({ opacity: 0, y: d * -distance }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: reduce ? 0.15 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="col-start-1 row-start-1"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Native radios styled like the Tabs pill variant: arrow keys move the selection, Tab leaves the group.
function PassPicker({ value, onChange, name }) {
  return (
    <fieldset className="w-full min-w-0 sm:w-[264px]">
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

// Six months from today; the pass fills 1, 3 or 6 of them. Dates are computed after mount to keep SSR stable.
function PassTimeline({ days }) {
  const [today, setToday] = useState(null)
  useEffect(() => setToday(new Date()), [])
  const filled = Math.round(days / 30)
  const months = Array.from({ length: MONTHS }, (_, i) =>
    today ? fmt(new Date(today.getFullYear(), today.getMonth() + i, 1), { month: 'short' }) : ''
  )
  const end = today ? new Date(today.getTime() + days * 86400000) : null

  return (
    <div className="rounded-[16px] p-5" style={{ background: TOOLS.resume.tint }}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[14px] font-medium" style={{ color: TOOLS.resume.deep }}>Your pass</p>
        <p className="text-[13px]" style={{ color: TOOLS.resume.deep }}>{days} days</p>
      </div>
      <div className="mt-4 grid grid-cols-6 gap-1.5" aria-hidden>
        {months.map((m, i) => (
          <div key={i}>
            <div
              className="h-2.5 rounded-full transition-colors duration-300"
              style={{ background: i < filled ? TOOLS.resume.strong : 'rgba(6,95,59,0.14)' }}
            />
            <p className="mt-1.5 text-[11.5px]" style={{ color: TOOLS.resume.deep, opacity: i < filled ? 1 : 0.55 }}>
              {m || ' '}
            </p>
          </div>
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-[13.5px]" style={{ borderColor: 'rgba(6,95,59,0.15)' }}>
        <div>
          <dt style={{ color: TOOLS.resume.deep, opacity: 0.75 }}>Starts</dt>
          <dd className="mt-0.5 font-medium" style={{ color: TOOLS.resume.deep }}>When you pay</dd>
        </div>
        <div>
          <dt style={{ color: TOOLS.resume.deep, opacity: 0.75 }}>Ends</dt>
          <dd className="mt-0.5 font-medium" style={{ color: TOOLS.resume.deep }}>
            {end ? fmt(end, { day: 'numeric', month: 'short', year: 'numeric' }) : ' '}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-[12.5px] leading-[1.5]" style={{ color: TOOLS.resume.deep, opacity: 0.8 }}>
        No auto-renew. It simply ends, and your free checks carry on.
      </p>
    </div>
  )
}

function FreePlan() {
  return (
    <div className="flex flex-col rounded-[28px] border bg-white p-6 sm:p-[35px]" style={{ borderColor: LINE }}>
      <div className="flex items-center lg:min-h-[44px]">
        <h3 className="text-[20px] font-medium" style={titleStyle}>Free</h3>
      </div>
      <div className="mt-6 flex h-7 items-center">
        <ToolTag tool="resume" />
      </div>
      <div className="mt-3">
        <Price amount={0} />
      </div>
      <p className="mt-2 text-[15px] leading-[1.5]" style={{ color: TEXT }}>
        5 resume checks every month
      </p>
      <SecondaryButton href="/analyze" className="mt-6 w-full">
        Start free
      </SecondaryButton>
      <ul className="mt-7 grid gap-y-3 border-t pt-6" style={{ borderColor: LINE }}>
        {FREE_FEATURES.map((f) => (
          <Feature key={f} marker={tick}>{f}</Feature>
        ))}
      </ul>
    </div>
  )
}

function ProPass() {
  const [index, setIndex] = useState(DEFAULT_PASS)
  const [dir, setDir] = useState(0)
  const groupName = useId()
  const pass = PASSES[index]
  const daily = perDayCost(pass)

  const choose = (next) => {
    if (next === index) return
    setDir(next > index ? 1 : -1)
    setIndex(next)
  }

  return (
    <div className="flex flex-col rounded-[28px] p-1.5 sm:p-2" style={{ background: MIST }}>
      <Surface className="flex-1 rounded-[20px] p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-[20px] font-medium" style={titleStyle}>Pro Pass</h3>
          <PassPicker value={index} onChange={choose} name={groupName} />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start">
        <div>
        <Swap id={pass.id} dir={dir}>
          <div className="flex h-7 items-center gap-2.5">
            <span className="text-[18px] font-medium" style={{ color: INK, letterSpacing: '-0.015em' }}>
              {pass.name}
            </span>
            {pass.best && (
              <Badge className="h-[22px] rounded-full border-transparent bg-[#0D0F0E] px-2.5 text-[12px] font-medium text-white">
                Best value
              </Badge>
            )}
          </div>
        </Swap>

        <Swap id={pass.id} dir={dir} roll className="mt-3">
          <div className="flex items-baseline gap-2">
            <Price amount={pass.price} />
            <span className="text-[15px]" style={{ color: MUTED }}>for {pass.days} days</span>
          </div>
          <p className="mt-2 text-[15px] leading-[1.5]" style={{ color: TEXT }}>
            About ₹{daily} a day
          </p>
        </Swap>

        <p className="sr-only" aria-live="polite">
          {`${pass.name} pass: ₹${pass.price} for ${pass.days} days, about ₹${daily} a day.`}
        </p>

        <PrimaryButton
          href="/pricing"
          className="mt-6 h-auto min-h-[44px] w-full whitespace-normal px-4 py-2.5 text-center leading-snug sm:w-auto sm:min-w-[272px] sm:px-6"
        >
          Get the {pass.name} pass
        </PrimaryButton>
        </div>
        <PassTimeline days={pass.days} />
        </div>

        <ul className="mt-7 grid gap-x-6 gap-y-3 border-t pt-6 sm:grid-cols-2" style={{ borderColor: LINE }}>
          <Feature marker={tick}>Everything in Free</Feature>
          <Feature marker={tick}>Unlimited resume checks</Feature>
          {PRO_TOOLS.map(({ tool, label }) => (
            <Feature key={tool} marker={<ToolDot tool={tool} />}>{label}</Feature>
          ))}
        </ul>
      </Surface>

      <p className="px-5 py-3.5 text-[13.5px] leading-[1.55] sm:px-7 sm:py-4" style={{ color: MUTED }}>
        One-time payment through Razorpay. No subscription, no auto-renew. Every pass has the same tools; only the
        length changes.
      </p>
    </div>
  )
}

export default function PricingSection() {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-24">
      <div className="max-w-[720px]">
        <h2 id="pricing-title" className="font-medium" style={headingStyle}>
          Free to start. <span className="sm:block">Cheap for placement season.</span>
        </h2>
        <p className="mt-5 max-w-[560px] text-[17px] leading-[1.6]" style={{ color: MUTED }}>
          Five free resume checks every month. A one-time Pro Pass adds unlimited checks and the four Pro tools for
          30, 90 or 180 days.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:mt-12 sm:gap-5 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-6">
        <FreePlan />
        <ProPass />
      </div>
    </section>
  )
}
