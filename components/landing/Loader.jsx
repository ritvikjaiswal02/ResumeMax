'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import './landing.css'
import { cn } from '@/lib/utils'
import { Surface } from './primitives'
import { INK, LINE, MIST, MUTED, TEXT, TOOLS } from './tokens'

/* Arc spinner that grows and shrinks while it turns, so it never reads as stuck. */
export function Spinner({ size = 16, color = INK, track = LINE, className }) {
  return (
    <svg className={cn('rmx-spinner shrink-0', className)} width={size} height={size} viewBox="0 0 50 50" fill="none" aria-hidden>
      {track && <circle cx="25" cy="25" r="20" stroke={track} strokeWidth="5" />}
      <circle className="rmx-arc" cx="25" cy="25" r="20" stroke={color} strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

/* Three bouncing dots for buttons and inline text. */
export function Dots({ color = 'currentColor', className }) {
  return (
    <span className={cn('inline-flex items-center gap-[3px]', className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="rmx-dot size-[5px] rounded-full" style={{ background: color, animationDelay: `${i * 0.14}s` }} />
      ))}
    </span>
  )
}

/* Seconds since mount, ticking every 250ms. */
export function useElapsed(running = true) {
  const [ms, setMs] = useState(0)
  useEffect(() => {
    if (!running) return
    const start = Date.now()
    const id = setInterval(() => setMs(Date.now() - start), 250)
    return () => clearInterval(id)
  }, [running])
  return ms / 1000
}

// Eases toward 94% so the bar always moves but never claims to be done.
const progressAt = (t, expected) => Math.min(94, 100 * (1 - Math.exp(-t / (expected * 0.55))))

/* Pulsing tool-coloured badge with a spinner inside. */
function Orb({ tool, size = 56 }) {
  const t = TOOLS[tool]
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <span className="rmx-halo absolute inset-0 rounded-full" style={{ background: t.strong }} aria-hidden />
      <span className="relative grid size-full place-items-center rounded-full bg-white" style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }}>
        <Spinner size={size * 0.5} color={t.strong} track={t.tint} />
      </span>
    </span>
  )
}

export function ProgressBar({ value, tool, className }) {
  const t = TOOLS[tool]
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full', className)} style={{ background: t.tint }} aria-hidden>
      <div
        className="rmx-shimmer h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${value}%`, background: t.strong }}
      />
    </div>
  )
}

/**
 * Full loading card for long jobs (10–40s). Steps advance with time, the bar
 * keeps creeping, and after `expected` seconds a reassurance line appears.
 * Props: tool, title, steps (string[]), expected (seconds), compact.
 */
export function ProgressSteps({ tool, title, steps, expected = 20, className }) {
  const t = TOOLS[tool]
  const elapsed = useElapsed()
  const progress = progressAt(elapsed, expected)
  // Spread steps over ~85% of the expected time; the last one holds until done.
  const current = Math.min(steps.length - 1, Math.floor((elapsed / (expected * 0.85)) * steps.length))
  const slow = elapsed > expected * 1.15

  return (
    <Surface className={cn('w-full max-w-[440px] px-6 py-8 sm:px-8', className)} role="status" aria-live="polite">
      <div className="flex items-center gap-4">
        <Orb tool={tool} />
        <div className="min-w-0">
          <p className="text-[18px] font-medium" style={{ color: INK, letterSpacing: '-0.02em' }}>{title}</p>
          <p className="mt-0.5 text-[13.5px] tabular-nums" style={{ color: MUTED }}>
            {slow ? 'Taking a little longer than usual. Hang tight.' : `Usually about ${expected} seconds`}
            <span aria-hidden> · {Math.floor(elapsed)}s</span>
          </p>
        </div>
      </div>

      <ProgressBar value={progress} tool={tool} className="mt-6" />

      <ol className="mt-6 flex flex-col gap-3.5">
        {steps.map((step, i) => {
          const done = i < current
          const running = i === current
          return (
            <li key={step} className="flex items-center gap-3 transition-opacity duration-300" style={{ opacity: i > current ? 0.4 : 1 }}>
              <span
                className="grid size-6 shrink-0 place-items-center rounded-full transition-colors duration-300"
                style={done ? { background: t.strong, color: '#fff' } : running ? { background: t.tint } : { background: MIST, boxShadow: `inset 0 0 0 1px ${LINE}` }}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : running ? <Spinner size={14} color={t.strong} track={null} /> : null}
              </span>
              <span className="text-[14.5px] font-medium" style={{ color: done ? t.deep : running ? INK : MUTED }}>
                {step}
                {running && <Dots className="ml-1.5" color={t.strong} />}
              </span>
            </li>
          )
        })}
      </ol>
      <span className="sr-only">{steps[current]}</span>
    </Surface>
  )
}

/**
 * Placeholder for text that is being written: shimmering lines that fill in
 * one by one, with a status chip on top.
 */
export function WritingSkeleton({ tool, label, lines = [92, 100, 86, 0, 100, 95, 72, 0, 98, 64], expected = 15, className }) {
  const t = TOOLS[tool]
  const elapsed = useElapsed()
  return (
    <div className={cn('flex flex-col', className)} role="status" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2.5 rounded-full bg-white px-3.5 py-2 text-[14px] font-medium" style={{ color: INK, boxShadow: `0 0 0 1px ${LINE}` }}>
          <Spinner size={16} color={t.strong} track={t.tint} />
          {label}
        </span>
        <span className="text-[13px] tabular-nums" style={{ color: t.deep }}>
          {elapsed > expected * 1.2 ? 'Almost there…' : `${Math.floor(elapsed)}s`}
        </span>
      </div>
      <ProgressBar value={progressAt(elapsed, expected)} tool={tool} className="mt-4" />
      <div className="mt-5 flex flex-col gap-3" aria-hidden>
        {lines.map((w, i) =>
          w === 0 ? (
            <span key={i} className="h-2" />
          ) : (
            <span
              key={i}
              className="rmx-shimmer rmx-type-line block h-3 rounded-full"
              style={{ '--w': `${w}%`, background: i % 4 === 0 ? t.tint : MIST, animationDelay: `${i * 0.12}s` }}
            />
          )
        )}
      </div>
    </div>
  )
}

/* Small grey skeleton block with shimmer. */
export function Skeleton({ className, style }) {
  return <span aria-hidden className={cn('rmx-shimmer block rounded-full', className)} style={{ background: MIST, ...style }} />
}

/* Centered page-level loader for route data (history detail etc.). */
export function PageLoader({ tool = 'resume', label = 'Loading' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-32" role="status">
      <Orb tool={tool} size={52} />
      <p className="text-[14.5px] font-medium" style={{ color: TEXT }}>
        {label}
        <Dots className="ml-1.5" color={TOOLS[tool].strong} />
      </p>
    </div>
  )
}
