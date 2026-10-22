'use client'

import { useState, useEffect } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleCheck,
  CircleX,
  Copy,
  Download,
  Info,
  LoaderCircle,
  Minus,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Surface, useReducedMotion } from '@/components/landing/primitives'
import { DANGER, INK, LINE, MIST, MUTED, SUCCESS, TEXT, TOOLS, WARNING } from '@/components/landing/tokens'
import { cn } from '@/lib/utils'

const R = TOOLS.resume

// Darker shades of the status colours for small text on white or tinted pills (AA contrast).
const INK_SUCCESS = '#067647'
const INK_WARNING = '#B54708'
const INK_DANGER = '#B42318'
const MISSING_BG = '#FDE8E7'

function alpha(hex, a) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

const stripMarkdown = (t) =>
  t.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')

// Score bands: 75+ strong, 55+ good, 35+ needs work, below that poor.
function band(score) {
  if (score >= 75) return { color: SUCCESS, ink: INK_SUCCESS, verdict: 'Strong match', note: 'Strong keyword alignment' }
  if (score >= 55) return { color: WARNING, ink: INK_WARNING, verdict: 'Good match', note: 'Good alignment, a few gaps' }
  if (score >= 35) return { color: DANGER, ink: INK_DANGER, verdict: 'Needs work', note: 'Several keywords missing' }
  return { color: DANGER, ink: INK_DANGER, verdict: 'Poor match', note: 'Major keyword gaps found' }
}

const STATUS = {
  error: { Icon: CircleX, color: DANGER, ink: INK_DANGER, label: 'Error' },
  warning: { Icon: TriangleAlert, color: WARNING, ink: INK_WARNING, label: 'Warning' },
  good: { Icon: CircleCheck, color: SUCCESS, ink: INK_SUCCESS, label: 'Looks good' },
}

const SEV = {
  fix: { ...STATUS.error, label: 'Fix' },
  warn: STATUS.warning,
  ok: { ...STATUS.good, label: 'Good' },
}

const secondaryBtn =
  'h-9 gap-1.5 rounded-full border border-[#D5D9D3] bg-white px-3.5 text-[13.5px] font-medium text-[#0D0F0E] shadow-none hover:bg-[#F4F6F2] hover:text-[#0D0F0E] focus-visible:ring-2 focus-visible:ring-[#0D0F0E] focus-visible:ring-offset-2'

/* ─── Score ring ─── */
function ScoreRing({ score, delta }) {
  const reduce = useReducedMotion()
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    setDrawn(false)
    const t = setTimeout(() => setDrawn(true), 80)
    return () => clearTimeout(t)
  }, [score])

  const r = 40
  const circ = 2 * Math.PI * r
  const offset = drawn || reduce ? circ - (score / 100) * circ : circ
  const b = band(score)

  const deltaInk = delta > 0 ? INK_SUCCESS : delta < 0 ? INK_DANGER : MUTED
  const deltaBg = delta > 0 ? alpha(SUCCESS, 0.13) : delta < 0 ? alpha(DANGER, 0.12) : MIST
  const DeltaIcon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus
  const deltaLabel = delta > 0 ? `+${delta} points` : delta < 0 ? `${delta} points` : 'No change'

  return (
    <div className="flex items-center gap-4 sm:gap-5">
      <div className="relative size-[112px] shrink-0">
        <svg viewBox="0 0 96 96" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="48" cy="48" r={r} fill="none" stroke={LINE} strokeWidth="8" />
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke={b.color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: reduce ? 'none' : 'stroke-dashoffset 900ms cubic-bezier(.33,1,.68,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[32px] font-medium leading-none tracking-[-0.03em] tabular-nums" style={{ color: INK }}>
            {score}
          </span>
          <span className="mt-1 text-[11.5px] leading-none" style={{ color: MUTED }}>
            of 100
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <h2 className="text-[13.5px]" style={{ color: MUTED }}>
          ATS match score
        </h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <span
            className="inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium"
            style={{ background: alpha(b.color, 0.13), color: b.ink }}
          >
            {b.verdict}
          </span>

          {/* Delta pill, only shown after a re-analysis */}
          {delta != null && (
            <span
              className="anim-chip inline-flex h-6 items-center gap-1 rounded-full px-2 text-[12.5px] font-medium tabular-nums"
              style={{ background: deltaBg, color: deltaInk }}
            >
              <DeltaIcon aria-hidden="true" className="size-3.5" />
              {deltaLabel}
            </span>
          )}
        </div>
        <p className="mt-2 text-[13.5px]" style={{ color: TEXT }}>
          {b.note}
        </p>
      </div>
    </div>
  )
}

/* ─── Copy button ─── */
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="outline"
      size="sm"
      aria-label={copied ? 'Rewrite copied' : 'Copy suggested rewrite'}
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className={cn('no-print h-8 shrink-0 gap-1.5 rounded-full border bg-white px-3 text-[12.5px] font-medium shadow-none hover:bg-white focus-visible:ring-2 focus-visible:ring-[#0D0F0E] focus-visible:ring-offset-2')}
      style={copied
        ? { borderColor: alpha(SUCCESS, 0.45), color: INK_SUCCESS }
        : { borderColor: alpha(R.deep, 0.25), color: R.deep }}
    >
      {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </Button>
  )
}

/* ─── Section header ─── */
function SectionTitle({ children, count, sub, extra }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[17px] font-medium tracking-[-0.01em]" style={{ color: INK }}>
            {children}
          </h2>
          {count != null && (
            <span
              className="inline-flex h-5 items-center rounded-full px-2 text-[12px] font-medium tabular-nums"
              style={{ background: MIST, color: TEXT, boxShadow: `inset 0 0 0 1px ${LINE}` }}
            >
              {count}
            </span>
          )}
          {extra}
        </div>
        {sub && <p className="mt-1 text-[13.5px]" style={{ color: MUTED }}>{sub}</p>}
      </div>
    </div>
  )
}

/* ─── Export report ─── */
function buildReportText(result) {
  const matched = result.keywords?.matched ?? []
  const missing = result.keywords?.missing ?? []
  const verdict = band(result.score).verdict
  const hr = '─'.repeat(48)
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const lines = [
    'ResumeMax ATS analysis report', `Generated ${date}`, hr, '',
    `ATS match score: ${result.score}/100 (${verdict})`, '',
    `Matched keywords (${matched.length}): ${matched.join(', ') || 'None'}`,
    `Missing keywords (${missing.length}): ${missing.join(', ') || 'None'}`, '',
  ]
  if (result.rewrites?.length > 0) {
    lines.push(hr, 'Suggested rewrites', hr, '')
    result.rewrites.forEach((rw, i) => {
      lines.push(`${i + 1}. Before:`, `   ${stripMarkdown(rw.original)}`, '', `   After:`, `   ${stripMarkdown(rw.rewritten)}`, '')
    })
  }
  if (result.insights?.length > 0) {
    lines.push(hr, 'Insights', hr, '')
    result.insights.forEach(ins => { lines.push(`[${SEV[ins.severity]?.label ?? 'Info'}] ${ins.title}`, ins.body, '') })
  }
  lines.push(hr, 'Generated by ResumeMax')
  return lines.join('\n')
}

function ExportToolbar({ result }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="no-print flex flex-wrap items-center justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => { navigator.clipboard.writeText(buildReportText(result)); setCopied(true); setTimeout(() => setCopied(false), 2500) }}
        className={secondaryBtn}
        style={copied ? { borderColor: alpha(SUCCESS, 0.45), color: INK_SUCCESS } : undefined}
      >
        {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
        <span aria-live="polite">{copied ? 'Report copied' : 'Copy report'}</span>
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.print()} className={secondaryBtn}>
        <Download aria-hidden="true" className="size-4" />
        Save as PDF
      </Button>
    </div>
  )
}

/* ─── Status row (ATS checks and insights) ─── */
function StatusRow({ status, title, body, label }) {
  const { Icon } = status
  return (
    <li className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
      <Icon aria-hidden="true" className="mt-[2px] size-[18px] shrink-0" style={{ color: status.color }} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className="inline-flex h-5 items-center rounded-full px-2 text-[12px] font-medium"
            style={{ background: alpha(status.color, 0.13), color: status.ink }}
          >
            {label ?? status.label}
          </span>
          <span className="text-[14.5px] font-medium leading-snug" style={{ color: INK }}>{title}</span>
        </div>
        {body && (
          <p className="mt-1 text-[14px] leading-[1.6]" style={{ color: TEXT }}>
            {body}
          </p>
        )}
      </div>
    </li>
  )
}

/* ─── ATS compatibility check ─── */
const ATS_ORDER = { error: 0, warning: 1, good: 2 }

function CountPill({ n, word, status }) {
  return (
    <span
      className="inline-flex h-5 items-center rounded-full px-2 text-[12px] font-medium tabular-nums"
      style={{ background: alpha(status.color, 0.13), color: status.ink }}
    >
      {n} {word}{n > 1 ? 's' : ''}
    </span>
  )
}

function AtsSection({ result }) {
  const [showAllGood, setShowAllGood] = useState(false)
  const items = result.ats_structure ?? []
  if (!items.length) return null

  const sorted = [...items].sort((a, b) => (ATS_ORDER[a.type] ?? 1) - (ATS_ORDER[b.type] ?? 1))
  const nonGood = sorted.filter(i => i.type !== 'good')
  const goodItems = sorted.filter(i => i.type === 'good')
  const visibleGood = showAllGood ? goodItems : goodItems.slice(0, 2)
  const hiddenGoodCount = goodItems.length - 2

  const errorCount = nonGood.filter(i => i.type === 'error').length
  const warningCount = nonGood.filter(i => i.type === 'warning').length

  return (
    <section>
      <SectionTitle
        sub="Based on your resume text. Checks structure and clarity, not visual layout."
        extra={
          <>
            {errorCount > 0 && <CountPill n={errorCount} word="error" status={STATUS.error} />}
            {warningCount > 0 && <CountPill n={warningCount} word="warning" status={STATUS.warning} />}
          </>
        }
      >
        ATS structure
      </SectionTitle>

      <Surface className="p-4 sm:p-6">
        {result.ats_summary && (
          <div
            className="mb-5 flex items-start gap-3 rounded-[12px] px-4 py-3.5"
            style={{ background: alpha(R.strong, 0.07), boxShadow: `inset 0 0 0 1px ${alpha(R.strong, 0.2)}` }}
          >
            <Info aria-hidden="true" className="mt-[2px] size-[18px] shrink-0" style={{ color: R.deep }} />
            <div className="min-w-0">
              <p className="text-[14.5px] leading-[1.6]" style={{ color: INK }}>
                {result.ats_summary}
              </p>
              <p className="mt-1 text-[13px]" style={{ color: R.deep }}>
                Fixing these issues can improve your ATS score.
              </p>
            </div>
          </div>
        )}

        <ul className="divide-y divide-[#E3E6E1]">
          {nonGood.map((item, i) => (
            <StatusRow
              key={i}
              status={STATUS[item.type] ?? STATUS.warning}
              title={item.title}
              body={item.description}
            />
          ))}
          {visibleGood.map((item, i) => (
            <StatusRow key={`good-${i}`} status={STATUS.good} title={item.title} body={item.description} />
          ))}
        </ul>

        {goodItems.length > 2 && (
          <button
            type="button"
            onClick={() => setShowAllGood(v => !v)}
            aria-expanded={showAllGood}
            className="no-print mt-4 inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium transition-colors hover:bg-[#F4F6F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D0F0E]"
            style={{ color: R.deep, boxShadow: `inset 0 0 0 1px ${LINE}` }}
          >
            {showAllGood
              ? 'Show fewer strengths'
              : `Show ${hiddenGoodCount} more strength${hiddenGoodCount > 1 ? 's' : ''}`}
          </button>
        )}
      </Surface>
    </section>
  )
}

/* ─── Keyword chip ─── */
const chipBase = 'inline-flex h-7 max-w-[190px] items-center rounded-full px-2.5 text-[13px] font-medium'

function KeywordColumn({ title, count, tone, children }) {
  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-medium" style={{ color: INK }}>{title}</h3>
        <span
          className="inline-flex h-5 items-center rounded-full px-2 text-[12px] font-medium tabular-nums"
          style={tone}
        >
          {count}
        </span>
      </div>
      {children}
    </div>
  )
}

/* ─── AnalysisResults ─── */
export default function AnalysisResults({ result, previousResult, comparisonSummary, reanalyzing }) {
  if (!result) return null

  const matched = result.keywords?.matched ?? []
  const missing = result.keywords?.missing ?? []
  const delta = previousResult != null ? result.score - previousResult.score : null

  const changeTone = delta > 0
    ? { color: SUCCESS, ink: INK_SUCCESS, Icon: ArrowUp }
    : delta < 0
    ? { color: DANGER, ink: INK_DANGER, Icon: ArrowDown }
    : { color: MUTED, ink: MUTED, Icon: Minus }

  return (
    <div className="relative flex flex-col gap-8">

      {/* Inline re-analyzing overlay */}
      {reanalyzing && (
        <div
          className="no-print pointer-events-none absolute inset-0 z-20 flex items-start justify-center rounded-[18px] pt-24"
          style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(2px)' }}
        >
          <div
            role="status"
            className="flex items-center gap-3 rounded-full bg-white px-5 py-3"
            style={{ boxShadow: '0 0 0 1px rgba(13,15,14,0.06), 0 16px 36px -14px rgba(13,15,14,0.22)' }}
          >
            <LoaderCircle aria-hidden="true" className="spin size-4 shrink-0" style={{ color: R.strong }} />
            <span className="text-[14px] font-medium" style={{ color: INK }}>
              Re-analyzing your resume…
            </span>
          </div>
        </div>
      )}

      {/* What changed, shown after re-analysis */}
      {comparisonSummary && (
        <Surface className="anim-fade-up flex items-start gap-3 p-4 sm:p-5">
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-[10px]"
            style={{ background: changeTone.color === MUTED ? MIST : alpha(changeTone.color, 0.13), color: changeTone.ink }}
          >
            <changeTone.Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-medium" style={{ color: INK }}>
              What changed
            </p>
            <p
              className="mt-1.5 break-words border-l-2 pl-3 text-[14.5px] leading-[1.6]"
              style={{ borderColor: changeTone.color === MUTED ? LINE : changeTone.color, color: TEXT }}
            >
              {comparisonSummary}
            </p>
          </div>
        </Surface>
      )}

      {/* Export toolbar */}
      <ExportToolbar result={result} />

      {/* 1. Score and keywords */}
      <Surface className="grid md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <div className="flex items-center p-4 sm:p-6">
          {/* Keyed to score so it re-animates on change */}
          <ScoreRing key={result.score} score={result.score} delta={delta} />
        </div>

        <div
          className="grid gap-6 border-t p-4 sm:grid-cols-2 sm:p-6 md:border-l md:border-t-0"
          style={{ borderColor: LINE }}
        >
          {/* Matched */}
          <KeywordColumn
            title="Matched keywords"
            count={matched.length}
            tone={{ background: alpha(SUCCESS, 0.13), color: INK_SUCCESS }}
          >
            {matched.length === 0 ? (
              <p className="text-[13.5px]" style={{ color: MUTED }}>None yet</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {matched.map((kw, i) => {
                  const isNew = previousResult && !(previousResult.keywords?.matched ?? []).includes(kw)
                  const truncated = kw.length > 32 ? kw.slice(0, 30) + '…' : kw
                  return (
                    <li key={kw} className="anim-chip" style={{ animationDelay: `${i * 30}ms` }}>
                      <span
                        title={isNew ? `${kw} (newly matched)` : kw}
                        className={chipBase}
                        style={isNew
                          ? { background: R.tint, color: R.deep, boxShadow: `inset 0 0 0 1.5px ${R.strong}` }
                          : { background: R.tint, color: R.deep }}
                      >
                        {isNew && (
                          <span aria-hidden="true" className="mr-1.5 size-1.5 shrink-0 rounded-full" style={{ background: R.strong }} />
                        )}
                        <span className="truncate">{truncated}</span>
                        {isNew && <span className="sr-only"> (new)</span>}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </KeywordColumn>

          {/* Missing */}
          <KeywordColumn
            title="Missing keywords"
            count={missing.length}
            tone={{ background: MISSING_BG, color: INK_DANGER }}
          >
            {missing.length === 0 ? (
              <p className="text-[13.5px]" style={{ color: MUTED }}>Nothing missing</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {missing.map((kw, i) => {
                  const truncated = kw.length > 32 ? kw.slice(0, 30) + '…' : kw
                  return (
                    <li key={kw} className="anim-chip" style={{ animationDelay: `${i * 30}ms` }}>
                      <Tooltip>
                        <TooltipTrigger
                          aria-label={`${kw}, missing from your resume`}
                          className={cn(chipBase, 'cursor-default border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B42318] focus-visible:ring-offset-1')}
                          style={{ background: MISSING_BG, color: INK_DANGER }}
                        >
                          <span className="truncate">{truncated}</span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="rounded-[8px] text-[12.5px]"
                          style={{ background: INK, color: '#FFFFFF', maxWidth: '240px' }}
                        >
                          Add &quot;{kw}&quot; to your resume
                        </TooltipContent>
                      </Tooltip>
                    </li>
                  )
                })}
              </ul>
            )}
          </KeywordColumn>
        </div>
      </Surface>

      {/* 2. ATS structure */}
      <AtsSection result={result} />

      {/* 3. Rewrites */}
      {result.rewrites?.length > 0 && (
        <section>
          <SectionTitle count={result.rewrites.length} sub="Copy these straight into your resume.">
            Bullet rewrites
          </SectionTitle>
          <div className="flex flex-col gap-4">
            {result.rewrites.map((rw, i) => (
              <Surface key={i} className="grid gap-3 p-4 sm:p-5 md:grid-cols-2">
                <div className="min-w-0 rounded-[12px] border p-4" style={{ borderColor: LINE }}>
                  <p className="text-[12.5px] font-medium" style={{ color: MUTED }}>Your bullet</p>
                  <p className="mt-2 text-[14.5px] leading-[1.6]" style={{ color: TEXT }}>
                    {stripMarkdown(rw.original)}
                  </p>
                </div>
                <div
                  className="flex min-w-0 flex-col rounded-[12px] border p-4"
                  style={{ borderColor: alpha(R.strong, 0.25), background: alpha(R.strong, 0.07) }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[12.5px] font-medium" style={{ color: R.deep }}>Suggested rewrite</p>
                    <CopyButton text={stripMarkdown(rw.rewritten)} />
                  </div>
                  <p className="mt-2 flex-1 text-[14.5px] leading-[1.6]" style={{ color: INK }}>
                    {stripMarkdown(rw.rewritten)}
                  </p>
                </div>
              </Surface>
            ))}
          </div>
        </section>
      )}

      {/* 4. Insights */}
      {result.insights?.length > 0 && (
        <section>
          <SectionTitle count={result.insights.length}>
            Insights
          </SectionTitle>
          <Surface className="p-4 sm:p-6">
            <ul className="divide-y divide-[#E3E6E1]">
              {result.insights.map((ins, i) => (
                <StatusRow key={i} status={SEV[ins.severity] ?? SEV.ok} title={ins.title} body={ins.body} />
              ))}
            </ul>
          </Surface>
        </section>
      )}

    </div>
  )
}
