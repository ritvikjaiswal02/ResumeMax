'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { CircleCheck, CircleX, FileText, HistoryIcon, RotateCw, TriangleAlert } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PrimaryButton, SectionHeader, Stage, Surface, useInView } from '@/components/landing/primitives'
import { DANGER, INK, LINE, MIST, MUTED, SUCCESS, TEXT, TOOLS, WARNING } from '@/components/landing/tokens'
import { cn } from '@/lib/utils'

const R = TOOLS.resume

// Darker shades of the status colours for small text on white or on a tinted pill (AA contrast).
const INK_SUCCESS = '#067647'
const INK_WARNING = '#B54708'
const INK_DANGER = '#B42318'

function alpha(hex, a) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

const HIGHLIGHT = alpha(R.strong, 0.26)

// Same thresholds as the product: 75+ strong, 55+ good, 35+ needs work, below that poor.
function band(score) {
  if (score >= 75) return { color: SUCCESS, ink: INK_SUCCESS, verdict: 'Strong' }
  if (score >= 55) return { color: WARNING, ink: INK_WARNING, verdict: 'Good' }
  return { color: DANGER, ink: INK_DANGER, verdict: score >= 35 ? 'Needs work' : 'Poor' }
}

const SCORE = { before: 52, after: 86 }

// The .rmx scope already shortens durations under reduced motion; this also drops the stagger delays.
const REDUCED_MOTION_CSS =
  '@media (prefers-reduced-motion: reduce){#tool-resume *,#tool-resume *::before,#tool-resume *::after{transition-delay:0s!important}}'

// ---------------------------------------------------------------- sample data

const JOB_POST = (() => {
  let matched = 0
  let missing = 0
  return [
    'We’re hiring a frontend developer to build our merchant dashboard in ',
    { word: 'React' },
    ' and ',
    { word: 'TypeScript' },
    '. You’ll connect to ',
    { word: 'REST APIs', missing: true },
    ', write unit tests with ',
    { word: 'Jest', missing: true },
    ' and manage state with ',
    { word: 'Redux', missing: true },
    '. Comfort with ',
    { word: 'Git' },
    ', ',
    { word: 'responsive CSS' },
    ' and ',
    { word: 'Figma' },
    ' handoffs is a plus. Bonus if you’ve deployed something on ',
    { word: 'AWS', missing: true },
    '.',
  ].map((seg) => (typeof seg === 'string' ? seg : { ...seg, order: seg.missing ? missing++ : matched++ }))
})()

const CHECKS = [
  { before: ['error', 'Skills section is missing'], after: ['good', 'Skills have their own section'] },
  { before: ['warning', 'Two bullets don’t show any results'], after: ['good', 'Every bullet shows a result'] },
  { before: ['warning', 'Dates are missing on one project'] },
  { before: ['good', 'Contact details are at the top'] },
  { before: ['good', 'Experience uses bullet points'] },
]

const STATUS = {
  error: { Icon: CircleX, color: DANGER, label: 'error' },
  warning: { Icon: TriangleAlert, color: WARNING, label: 'warning' },
  good: { Icon: CircleCheck, color: SUCCESS, label: 'looks good' },
}

const OLD_BULLET =
  'Worked on the frontend for CampusCart, a website where students buy and sell stuff, and made the pages load faster.'

const SCORE_HISTORY = [
  { date: 'Oct 2', score: 41 },
  { date: 'Oct 4', score: 52 },
  { date: 'Oct 9', score: 74 },
  { date: 'Oct 12', score: 86 },
]

const SAVED_CHECKS = [
  { title: 'Frontend Developer, fresher', company: 'Kestrel Pay', score: 86, when: 'Today' },
  { title: 'UI Engineer, graduate', company: 'Juniper Health', score: 68, when: '2 days ago' },
  { title: 'Software Engineer, frontend', company: 'Tidewater Labs', score: 47, when: '5 days ago' },
]

// Three hand-drawn pen loops (viewBox 100 x 40) so the circles don't look stamped.
const PEN_LOOPS = [
  'M14 8C38 1 82 2 94 12C100 18 96 31 76 36C55 41 20 39 8 30C1 24 4 12 22 6C30 3.5 40 3 50 3.5',
  'M10 14C16 4 70 0 90 8C99 13 98 28 82 34C62 41 24 40 10 32C2 27 3 18 14 11C22 7 33 5 44 5',
  'M86 7C62 1 22 2 9 12C1 19 5 32 26 36C48 40 84 39 94 29C100 22 95 11 78 6C70 4 60 3.6 52 4',
]

// ---------------------------------------------------------------- helpers

// Counts a number towards its target (ease-out cubic). Jumps straight there under reduced motion.
function useTween(target, duration = 700) {
  const [value, setValue] = useState(target)
  const shown = useRef(target)
  useEffect(() => {
    const from = shown.current
    if (from === target) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shown.current = target
      setValue(target)
      return undefined
    }
    let frame = 0
    let start = 0
    const tick = (now) => {
      if (!start) start = now
      const p = Math.min(1, (now - start) / duration)
      const next = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)))
      shown.current = next
      setValue(next)
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}

// Cross-fades two versions of one slot. Both share a grid cell, so switching never moves the layout.
function Swap({ on, a, b, className, style }) {
  const layer = 'col-start-1 row-start-1 transition-[opacity,transform] duration-300 ease-out'
  return (
    <span className={cn('grid', className)} style={style}>
      <span
        aria-hidden={on || undefined}
        className={layer}
        style={{ opacity: on ? 0 : 1, transform: on ? 'translateY(-3px)' : 'none' }}
      >
        {a}
      </span>
      <span
        aria-hidden={!on || undefined}
        className={layer}
        style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(3px)' }}
      >
        {b}
      </span>
    </span>
  )
}

function Placeholder() {
  return (
    <span
      className="whitespace-nowrap rounded-[5px] px-[3px] font-medium"
      style={{ color: R.deep, background: '#FFFFFF', boxShadow: `inset 0 0 0 1px ${alpha(R.deep, 0.3)}` }}
    >
      [X]
    </span>
  )
}

// ---------------------------------------------------------------- block 1: results screen

function Keyword({ word, missing, order, revealed, after, intro }) {
  const marked = revealed && (!missing || after)
  const circled = revealed && Boolean(missing) && !after
  const markDelay = marked ? (missing ? 240 : 180) + order * 90 : 0
  const drawDelay = intro ? 700 + order * 150 : 160 + order * 110
  const eraseDelay = order * 60
  const status = !missing ? 'on your resume' : after ? 'now on your resume' : 'missing from your resume'

  return (
    <span
      className={cn('relative whitespace-nowrap rounded-[4px] px-[0.14em] font-medium', missing && 'mx-[0.3em]')}
      style={{
        color: INK,
        backgroundImage: `linear-gradient(${HIGHLIGHT}, ${HIGHLIGHT})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '0 62%',
        backgroundSize: marked ? '100% 80%' : '0% 80%',
        transition: `background-size ${marked ? 480 : 220}ms cubic-bezier(.6,.05,.3,1) ${markDelay}ms`,
      }}
    >
      {word}
      <span className="sr-only"> ({status})</span>
      {missing && (
        <svg
          aria-hidden="true"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          className="pointer-events-none absolute overflow-visible"
          style={{ left: '-0.34em', top: '-0.26em', width: 'calc(100% + 0.68em)', height: 'calc(100% + 0.52em)' }}
        >
          <path
            d={PEN_LOOPS[order % PEN_LOOPS.length]}
            fill="none"
            stroke={DANGER}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            pathLength="1"
            style={{
              strokeDasharray: '1',
              strokeDashoffset: circled ? '0' : '1',
              opacity: circled ? 1 : 0,
              transition: circled
                ? `stroke-dashoffset 560ms cubic-bezier(.5,.1,.3,1) ${drawDelay}ms, opacity 1ms linear ${drawDelay}ms`
                : `stroke-dashoffset 280ms ease-in ${eraseDelay}ms, opacity 160ms linear ${eraseDelay + 200}ms`,
            }}
          />
        </svg>
      )}
    </span>
  )
}

function FileChip({ after }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-white"
        style={{ boxShadow: '0 0 0 1px rgba(13,15,14,0.06), 0 1px 2px rgba(13,15,14,0.06)' }}
      >
        <FileText className="size-[18px]" style={{ color: R.deep }} />
      </span>
      <div className="min-w-0 leading-tight">
        <Swap
          on={after}
          a="Aditi_Sharma_Resume.pdf"
          b="Aditi_Sharma_Resume_v2.pdf"
          className="text-[14px] font-medium"
          style={{ color: INK }}
        />
        <Swap
          on={after}
          a="Checked on Oct 4"
          b="Checked 2 min ago"
          className="mt-0.5 text-[13px]"
          style={{ color: R.deep }}
        />
      </div>
    </div>
  )
}

function JobPostPanel({ after, revealed, intro }) {
  return (
    <Surface className="flex flex-col p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 text-[13px]" style={{ color: MUTED }}>
        <span>Job description</span>
        <span className="tabular-nums">281 / 3,000</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-[10px] text-[15px] font-medium"
          style={{ background: MIST, color: INK, boxShadow: `inset 0 0 0 1px ${LINE}` }}
        >
          K
        </span>
        <div className="min-w-0">
          <h3 className="text-[17px] font-medium leading-snug tracking-[-0.015em]" style={{ color: INK }}>
            Frontend Developer, fresher
          </h3>
          <p className="text-[13.5px]" style={{ color: MUTED }}>
            Kestrel Pay, Bengaluru
          </p>
        </div>
      </div>

      <p className="mb-5 mt-4 text-[15px] leading-[1.9] sm:text-[16px]" style={{ color: TEXT }}>
        {JOB_POST.map((seg, i) =>
          typeof seg === 'string' ? (
            <Fragment key={i}>{seg}</Fragment>
          ) : (
            <Keyword key={seg.word} {...seg} revealed={revealed} after={after} intro={intro} />
          )
        )}
      </p>

      <div
        className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-4 text-[13px]"
        style={{ borderColor: LINE, color: MUTED }}
      >
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-5 rounded-[3px]" style={{ background: HIGHLIGHT }} />
          On your resume
        </span>
        <span className="inline-flex items-center gap-2">
          <svg aria-hidden="true" viewBox="0 0 100 40" preserveAspectRatio="none" className="h-3.5 w-6 overflow-visible">
            <path
              d={PEN_LOOPS[0]}
              fill="none"
              stroke={DANGER}
              strokeWidth="1.6"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          Missing from your resume
        </span>
      </div>
    </Surface>
  )
}

function ScoreRing({ score, shown, revealed }) {
  const r = 40
  const c = 2 * Math.PI * r
  const offset = revealed ? c * (1 - score / 100) : c
  return (
    <div className="relative size-[92px] shrink-0">
      <svg viewBox="0 0 96 96" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="48" cy="48" r={r} fill="none" stroke={LINE} strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          style={{
            stroke: band(shown).color,
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 700ms cubic-bezier(.33,1,.68,1), stroke 240ms linear',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-medium leading-none tracking-[-0.03em] tabular-nums" style={{ color: INK }}>
          {shown}
        </span>
        <span className="mt-1 text-[11px] leading-none" style={{ color: MUTED }}>
          of 100
        </span>
      </div>
    </div>
  )
}

function CheckRow({ check, after }) {
  const [fromType, fromText] = check.before
  const [toType, toText] = check.after ?? check.before
  const flipped = Boolean(check.after) && after
  const from = STATUS[fromType]
  const to = STATUS[toType]
  const icon = 'col-start-1 row-start-1 size-4 transition-[opacity,transform] duration-300 ease-out'
  return (
    <li className="flex items-start gap-2.5">
      <span aria-hidden="true" className="mt-[2px] grid size-4 shrink-0">
        <from.Icon
          className={icon}
          style={{ color: from.color, opacity: flipped ? 0 : 1, transform: flipped ? 'scale(0.5)' : 'none' }}
        />
        <to.Icon
          className={icon}
          style={{ color: to.color, opacity: flipped ? 1 : 0, transform: flipped ? 'none' : 'scale(0.5)' }}
        />
      </span>
      <Swap
        on={flipped}
        a={
          <>
            {fromText}
            <span className="sr-only"> ({from.label})</span>
          </>
        }
        b={
          <>
            {toText}
            <span className="sr-only"> ({to.label})</span>
          </>
        }
        className="min-w-0 text-[14px] leading-[1.45]"
        style={{ color: TEXT }}
      />
    </li>
  )
}

function ResultsPanel({ after, revealed }) {
  const score = after ? SCORE.after : SCORE.before
  const shown = useTween(score)
  const b = band(shown)
  return (
    <Surface className="p-4 sm:p-6">
      <div className="grid gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-1 lg:gap-0">
        <div className="flex items-center gap-4 sm:gap-5">
          <ScoreRing score={score} shown={shown} revealed={revealed} />
          <div className="min-w-0">
            <h3 className="text-[13.5px]" style={{ color: MUTED }}>
              ATS match score
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span
                className="inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium"
                style={{
                  background: alpha(b.color, 0.13),
                  color: b.ink,
                  transition: 'background-color 240ms linear, color 240ms linear',
                }}
              >
                {b.verdict}
              </span>
              <span
                aria-hidden={!after || undefined}
                className="text-[13px] font-medium tabular-nums transition-opacity duration-300"
                style={{ color: INK_SUCCESS, opacity: after ? 1 : 0 }}
              >
                +34 since Oct 4
              </span>
            </div>
            <p className="mt-2 text-[13.5px]" style={{ color: TEXT }}>
              <span className="tabular-nums">{after ? 9 : 5}</span> of 9 keywords matched
            </p>
          </div>
        </div>

        <div
          className="border-t pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0 lg:mt-5 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-5"
          style={{ borderColor: LINE }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[15px] font-medium" style={{ color: INK }}>
              ATS structure
            </h3>
            <Swap on={after} a="3 to fix" b="1 to fix" className="text-[13px] tabular-nums" style={{ color: MUTED }} />
          </div>
          <ul className="mt-3 space-y-2.5">
            {CHECKS.map((check) => (
              <CheckRow key={check.before[1]} check={check} after={after} />
            ))}
          </ul>
        </div>
      </div>
    </Surface>
  )
}

function BulletPanel({ after }) {
  return (
    <Surface className="p-4 sm:p-6 lg:col-span-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-[15px] font-medium" style={{ color: INK }}>
          Bullet rewrite
        </h3>
        <Swap
          on={after}
          a={<span style={{ color: MUTED }}>1 of 2 weak bullets</span>}
          b={
            <span className="inline-flex items-center gap-1.5" style={{ color: INK_SUCCESS }}>
              <CircleCheck aria-hidden="true" className="size-3.5" />
              No weak bullets left
            </span>
          }
          className="text-[13px]"
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-[12px] border p-4" style={{ borderColor: LINE }}>
          <Swap on={after} a="Your bullet" b="Old version" className="text-[12.5px] font-medium" style={{ color: MUTED }} />
          <p
            className="mt-2 text-[14.5px] leading-[1.6]"
            style={{
              color: after ? MUTED : TEXT,
              textDecorationLine: 'line-through',
              textDecorationThickness: '1.5px',
              textDecorationColor: after ? alpha(DANGER, 0.7) : 'transparent',
              transition: 'color 300ms ease-out, text-decoration-color 300ms ease-out',
            }}
          >
            {OLD_BULLET}
          </p>
        </div>
        <div
          className="rounded-[12px] border p-4 transition-colors duration-300"
          style={{ borderColor: after ? alpha(SUCCESS, 0.45) : alpha(R.strong, 0.2), background: alpha(R.strong, 0.07) }}
        >
          <Swap
            on={after}
            a="Suggested rewrite"
            b={
              <span className="inline-flex items-center gap-1.5">
                <CircleCheck aria-hidden="true" className="size-3.5" style={{ color: SUCCESS }} />
                On your resume now
              </span>
            }
            className="text-[12.5px] font-medium"
            style={{ color: R.deep }}
          />
          <p className="mt-2 text-[14.5px] leading-[1.6]" style={{ color: INK }}>
            Built the React storefront for CampusCart, a college marketplace used by <Placeholder /> students, and cut
            page load time by <Placeholder />%.
          </p>
        </div>
      </div>

      <p className="mt-3 text-[12.5px]" style={{ color: MUTED }}>
        <Placeholder /> marks a number only you know. ResumeMax never makes one up.
      </p>
    </Surface>
  )
}

// ---------------------------------------------------------------- block 2: re-check progress

function ScoreChart({ drawn }) {
  const last = SCORE_HISTORY.length - 1
  const x = (i) => (i / last) * 100
  const y = (score) => ((100 - score) / 80) * 100 // plots the 20 to 100 range
  const points = SCORE_HISTORY.map((p, i) => `${x(i)},${y(p.score)}`).join(' ')

  return (
    <figure className="mt-5">
      <div className="relative mx-4 h-[140px] sm:mx-5 sm:h-[150px]">
        <div
          aria-hidden="true"
          className="absolute -inset-x-4 top-0 rounded-[10px] sm:-inset-x-5"
          style={{ height: `${y(75)}%`, background: alpha(R.strong, 0.09) }}
        >
          <span className="absolute left-3 top-2 text-[11.5px] font-medium" style={{ color: R.deep }}>
            Strong, 75+
          </span>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            clipPath: drawn ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
            transition: 'clip-path 900ms cubic-bezier(.45,.05,.25,1) 120ms',
          }}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full">
            <polyline
              points={points}
              fill="none"
              stroke={R.strong}
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {SCORE_HISTORY.map((p, i) => (
          <div
            key={p.date}
            aria-hidden="true"
            className="absolute"
            style={{
              left: `${x(i)}%`,
              top: `${y(p.score)}%`,
              opacity: drawn ? 1 : 0,
              transition: `opacity 260ms ease-out ${120 + i * 260}ms`,
            }}
          >
            <span
              className="absolute left-0 top-0 block size-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
              style={{ boxShadow: `inset 0 0 0 2.5px ${band(p.score).color}` }}
            />
            <span
              className={cn(
                'absolute bottom-[9px] left-0 -translate-x-1/2 leading-none tabular-nums',
                i === last ? 'text-[15px] font-medium' : 'text-[12.5px]'
              )}
              style={{ color: i === last ? INK : TEXT }}
            >
              {p.score}
            </span>
          </div>
        ))}
      </div>

      <div aria-hidden="true" className="relative mx-4 mt-2.5 h-4 sm:mx-5">
        {SCORE_HISTORY.map((p, i) => (
          <span
            key={p.date}
            className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[12px] leading-4"
            style={{ left: `${x(i)}%`, color: MUTED }}
          >
            {p.date}
          </span>
        ))}
      </div>

      <figcaption className="sr-only">
        Match score for this job across four checks: 41 on Oct 2, 52 on Oct 4, 74 on Oct 9 and 86 on Oct 12.
      </figcaption>
    </figure>
  )
}

function SavedChecks() {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h4 className="inline-flex items-center gap-2 text-[15px] font-medium" style={{ color: INK }}>
          <HistoryIcon aria-hidden="true" className="size-4" style={{ color: MUTED }} />
          History
        </h4>
        <p className="text-[13px]" style={{ color: MUTED }}>
          Saved automatically
        </p>
      </div>
      <ul className="mt-3 space-y-1">
        {SAVED_CHECKS.map((item, i) => {
          const b = band(item.score)
          return (
            <li
              key={item.company}
              className="flex items-start gap-3 rounded-[12px] p-3"
              style={{ background: i === 0 ? MIST : undefined }}
            >
              <span
                className="inline-flex h-7 min-w-[40px] shrink-0 items-center justify-center rounded-full px-2 text-[13px] font-medium tabular-nums"
                style={{ background: alpha(b.color, 0.14), color: b.ink }}
              >
                <span className="sr-only">Score </span>
                {item.score}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium leading-snug" style={{ color: INK }}>
                  {item.title}
                </p>
                <div
                  className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-3 text-[13px]"
                  style={{ color: MUTED }}
                >
                  <span>{item.company}</span>
                  <span>{item.when}</span>
                </div>
                {i === 0 && (
                  <span
                    aria-hidden="true"
                    className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium"
                    style={{ color: R.deep }}
                  >
                    <RotateCw className="size-3.5" />
                    Re-analyze this role
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function ProgressBlock() {
  const [chartRef, chartIn] = useInView({ threshold: 0.4 })
  return (
    <div className="mt-6 rounded-[28px] p-4 sm:mt-8 sm:p-6 lg:p-8" style={{ background: MIST }}>
      <div className="max-w-[560px]">
        <h3
          className="text-[22px] font-medium leading-[1.15] tracking-[-0.025em] sm:text-[24px]"
          style={{ color: INK }}
        >
          Re-check and watch it climb
        </h3>
        <p className="mt-2 text-[15px] leading-[1.6]" style={{ color: MUTED }}>
          Upload your improved resume against the same job to see the old score next to the new one, with a short note
          on what changed. Every check is saved to History, so you can reopen or re-run it later.
        </p>
      </div>

      <Surface className="mt-5 grid sm:mt-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div ref={chartRef} className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-[15px] font-medium" style={{ color: INK }}>
                Frontend Developer, fresher
              </h4>
              <p className="mt-0.5 text-[13px]" style={{ color: MUTED }}>
                Kestrel Pay
              </p>
            </div>
            <p className="shrink-0 text-[13px]" style={{ color: MUTED }}>
              4 checks
            </p>
          </div>

          <ScoreChart drawn={chartIn} />

          <div className="mt-5 border-t pt-4" style={{ borderColor: LINE }}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-medium" style={{ color: INK }}>
                What improved since Oct 4
              </p>
              <span
                className="rounded-full px-2 py-0.5 text-[12.5px] font-medium tabular-nums"
                style={{ background: alpha(SUCCESS, 0.13), color: INK_SUCCESS }}
              >
                +34
              </span>
            </div>
            <blockquote
              className="mt-2 border-l-2 pl-3 text-[14.5px] leading-[1.6]"
              style={{ borderColor: R.strong, color: TEXT }}
            >
              You added Jest, Redux, REST APIs and AWS to your projects and rewrote two weak bullets, which moved you
              from needs work to strong.
            </blockquote>
          </div>
        </div>

        <div className="border-t p-4 sm:p-6 lg:border-l lg:border-t-0" style={{ borderColor: LINE }}>
          <SavedChecks />
        </div>
      </Surface>
    </div>
  )
}

// ---------------------------------------------------------------- section

export default function ResumeCheckSection() {
  const [view, setView] = useState('before')
  const [touched, setTouched] = useState(false)
  const [stageRef, stageIn] = useInView({ threshold: 0.2 })
  const after = view === 'after'

  const onViewChange = (value) => {
    setView(value)
    setTouched(true)
  }

  return (
    <section id="tool-resume" data-tool="resume" className="scroll-mt-28">
      <style dangerouslySetInnerHTML={{ __html: REDUCED_MOTION_CSS }} />

      <SectionHeader
        tool="resume"
        title="See your resume the way the ATS does."
        description="Upload your resume as a PDF and paste the job post you’re applying to. In about 30 seconds you’ll see your match score, the keywords you’re missing and stronger versions of your weak bullet points."
      />

      <div
        ref={stageRef}
        className="mt-8 sm:mt-10"
        style={{
          opacity: stageIn ? 1 : 0,
          transform: stageIn ? 'none' : 'translateY(16px)',
          transition: 'opacity 500ms ease-out, transform 500ms cubic-bezier(.2,.7,.2,1)',
        }}
      >
        <Stage tool="resume">
          <Tabs value={view} onValueChange={onViewChange} className="gap-4 sm:gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <FileChip after={after} />
              <TabsList
                aria-label="Compare results"
                className="h-10 w-full p-1 sm:w-auto"
                style={{ background: alpha(R.deep, 0.1), color: R.deep }}
              >
                <TabsTrigger value="before" className="px-4 text-[14px]">
                  Before fixes
                </TabsTrigger>
                <TabsTrigger value="after" className="px-4 text-[14px]">
                  After fixes
                </TabsTrigger>
              </TabsList>
            </div>

            {/* One panel whose value follows the active tab, so the screen morphs in place instead of swapping. */}
            <TabsContent
              value={view}
              className="rounded-[20px] focus-visible:ring-2 focus-visible:ring-[#0D0F0E] focus-visible:ring-offset-4 focus-visible:ring-offset-[#D9F6E6]"
            >
              <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]">
                <JobPostPanel after={after} revealed={stageIn} intro={!touched} />
                <ResultsPanel after={after} revealed={stageIn} />
                <BulletPanel after={after} />
              </div>
            </TabsContent>
          </Tabs>
        </Stage>
      </div>

      <ProgressBlock />

      <div className="mt-8 flex flex-col items-start gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-5">
        <PrimaryButton href="/analyze">Check my resume free</PrimaryButton>
        <p className="text-[14px]" style={{ color: MUTED }}>
          5 free checks every month. No card needed.
        </p>
      </div>
    </section>
  )
}
