'use client'

import { useState } from 'react'
import {
  ArrowRight, Check, ChevronDown, Copy, Download, FileText, FileUser, Lock, Mail,
  MessageSquare, Mic, PenLine, Send, Sparkles, TriangleAlert,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { PrimaryButton, SecondaryButton, Stage, Surface, ToolTag } from '@/components/landing/primitives'
import { Dots, Spinner, WritingSkeleton } from '@/components/landing/Loader'
import { INK, LINE, MIST, MUTED, SUCCESS, TEXT, TOOLS } from '@/components/landing/tokens'
import { cn } from '@/lib/utils'

const SMALL_BTN = 'h-9 gap-1.5 px-3.5 text-[13.5px]'
const INPUT_CLASS =
  'h-11 rounded-[12px] border-[#E3E6E1] bg-white px-3.5 text-[16px] text-[#0D0F0E] shadow-[0_1px_2px_rgba(13,15,14,0.04)] transition-[border-color,box-shadow] placeholder:text-[#9AA09C] hover:border-[#D5D9D3] focus-visible:border-[#0D0F0E] focus-visible:ring-4 focus-visible:ring-[#0D0F0E]/10 md:text-[15px]'

export const TOOL_ICONS = { resume: FileText, cover: PenLine, outreach: Send, interview: Mic }

/* ─── Tool switcher ───
   items: [{ id, label, meta, state: 'idle' | 'loading' | 'ready' }] */
export function ToolSwitcher({ items, active, onChange }) {
  return (
    <div className="no-print sticky top-[76px] z-30">
      <div
        role="tablist"
        aria-label="Your tools for this job"
        className="flex gap-1.5 overflow-x-auto rounded-[20px] bg-white/90 p-1.5 backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4"
        style={{ boxShadow: '0 0 0 1px rgba(13,15,14,0.07), 0 12px 32px -16px rgba(13,15,14,0.25)' }}
      >
        {items.map((it) => {
          const t = TOOLS[it.id]
          const Icon = TOOL_ICONS[it.id]
          const on = it.id === active
          return (
            <button
              key={it.id}
              role="tab"
              aria-selected={on}
              aria-controls={`panel-${it.id}`}
              id={`tab-${it.id}`}
              onClick={() => onChange(it.id)}
              className={cn(
                'group flex shrink-0 items-center gap-2.5 rounded-[14px] py-2 pl-2 pr-3.5 text-left transition-all duration-200',
                on ? 'shadow-[0_6px_18px_-10px_rgba(13,15,14,0.35)]' : 'hover:bg-[#F4F6F2]'
              )}
              style={on ? { background: t.tint } : undefined}
            >
              <span
                className="grid size-8 shrink-0 place-items-center rounded-[10px] transition-colors"
                style={on ? { background: '#fff', color: t.deep } : { background: MIST, color: MUTED }}
              >
                {it.state === 'loading' ? <Spinner size={16} color={t.strong} track={t.tint} /> : <Icon className="size-4" aria-hidden />}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[14px] font-medium leading-tight" style={{ color: on ? t.deep : INK }}>
                  {it.label}
                  {it.state === 'ready' && (
                    <span className="grid size-4 place-items-center rounded-full text-white" style={{ background: t.strong }}>
                      <Check className="size-2.5" strokeWidth={3.5} aria-hidden />
                      <span className="sr-only">(ready)</span>
                    </span>
                  )}
                </span>
                {it.meta && (
                  <span className="mt-0.5 block whitespace-nowrap text-[12px] leading-tight" style={{ color: on ? t.deep : MUTED }}>
                    {it.meta}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Shared bits ─── */
function ErrorNote({ children }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-[12px] px-4 py-3 text-[14px] leading-[1.5]" style={{ background: '#FDE8E7', color: '#B42318' }}>
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  )
}

function CopyBtn({ copied, onClick, label = 'Copy' }) {
  return (
    <SecondaryButton onClick={onClick} className={SMALL_BTN} aria-live="polite">
      {copied ? <Check className="size-4" style={{ color: SUCCESS }} aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? 'Copied' : label}
    </SecondaryButton>
  )
}

/* Generate button that also tells free users what it costs. */
function GenerateButton({ tool, access, hasResult, loading, onClick, label }) {
  const locked = access === 'locked'
  return (
    <PrimaryButton onClick={onClick} disabled={loading} className="h-12 w-full gap-2 text-[15px] disabled:opacity-60">
      {loading ? (
        <>Working on it <Dots /></>
      ) : locked ? (
        <><Lock className="size-4" aria-hidden /> Unlock with Pro</>
      ) : (
        <><Sparkles className="size-4" aria-hidden /> {hasResult ? 'Write a new version' : label}</>
      )}
    </PrimaryButton>
  )
}

function AccessNote({ tool, status }) {
  if (!status) return null
  return (
    <p className="mt-2.5 text-center text-[13px]" style={{ color: TOOLS[tool].deep }}>{status}</p>
  )
}

/* Left column of every Pro panel: what the tool does + the main action. */
function Brief({ tool, title, description, points, children }) {
  const t = TOOLS[tool]
  return (
    <div className="flex flex-col">
      <ToolTag tool={tool} />
      <h2 className="mt-4 font-medium" style={{ color: INK, fontSize: 'clamp(26px, 3vw, 34px)', lineHeight: 1.05, letterSpacing: '-0.035em' }}>
        {title}
      </h2>
      <p className="mt-3 text-[15px] leading-[1.6]" style={{ color: t.deep }}>{description}</p>
      <div className="mt-6">{children}</div>
      {points && (
        <ul className="mt-7 hidden flex-col gap-2.5 border-t pt-5 lg:flex" style={{ borderColor: 'rgba(13,15,14,0.08)' }}>
          {points.map((p) => (
            <li key={p} className="flex gap-2.5 text-[13.5px] leading-[1.5]" style={{ color: t.deep }}>
              <Check className="mt-[3px] size-3.5 shrink-0" strokeWidth={2.5} style={{ color: t.strong }} aria-hidden />
              {p}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EmptyOutput({ tool, Icon, title, copy }) {
  const t = TOOLS[tool]
  return (
    <div className="flex h-full min-h-[360px] flex-col items-center justify-center px-6 py-14 text-center">
      <span className="relative grid size-16 place-items-center rounded-[20px]" style={{ background: t.tint, color: t.deep }}>
        <Icon className="size-7" strokeWidth={1.75} aria-hidden />
      </span>
      <p className="mt-5 text-[17px] font-medium" style={{ color: INK, letterSpacing: '-0.01em' }}>{title}</p>
      <p className="mt-1.5 max-w-[340px] text-[14px] leading-[1.6]" style={{ color: MUTED }}>{copy}</p>
      <div className="mt-8 flex w-full max-w-[360px] flex-col gap-2.5 opacity-70" aria-hidden>
        {[100, 88, 94, 60].map((w, i) => (
          <span key={i} className="h-2.5 rounded-full" style={{ width: `${w}%`, background: i === 0 ? t.tint : MIST }} />
        ))}
      </div>
    </div>
  )
}

function PanelLayout({ tool, brief, children }) {
  return (
    <Stage tool={tool} id={`panel-${tool}`} role="tabpanel" aria-labelledby={`tab-${tool}`} className="anim-fade-up lg:p-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-12">
        {brief}
        <Surface className="min-w-0 overflow-hidden">{children}</Surface>
      </div>
    </Stage>
  )
}

/* ─── Cover letter ─── */
export function CoverLetterPanel({ access, status, letter, loading, error, onGenerate, copied, onCopy, downloading, onDownload }) {
  const words = letter ? letter.trim().split(/\s+/).length : 0
  return (
    <PanelLayout
      tool="cover"
      brief={
        <Brief
          tool="cover"
          title="A cover letter for this exact job."
          description="Three or four tight paragraphs written from your resume, in the company's own words."
          points={['Never makes up experience you don’t have', '[X] marks a number only you know', 'Download as a clean PDF']}
        >
          <GenerateButton tool="cover" access={access} hasResult={!!letter} loading={loading} onClick={onGenerate} label="Write my cover letter" />
          <AccessNote tool="cover" status={status} />
        </Brief>
      }
    >
      {loading ? (
        <div className="p-6 sm:p-8"><WritingSkeleton tool="cover" label="Writing your cover letter" expected={15} /></div>
      ) : letter ? (
        <div className="anim-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6" style={{ borderColor: LINE }}>
            <span className="flex items-center gap-2 text-[13.5px] font-medium" style={{ color: MUTED }}>
              <FileText className="size-4" style={{ color: TOOLS.cover.deep }} aria-hidden />
              cover_letter.pdf
              <span className="rounded-full px-2 py-0.5 text-[12px] tabular-nums" style={{ background: MIST, color: TEXT }}>{words} words</span>
            </span>
            <div className="flex items-center gap-2">
              <CopyBtn copied={copied} onClick={onCopy} />
              <SecondaryButton onClick={onDownload} disabled={downloading} className={cn(SMALL_BTN, 'disabled:opacity-60')}>
                {downloading ? <>Exporting <Dots /></> : <><Download className="size-4" aria-hidden />PDF</>}
              </SecondaryButton>
            </div>
          </div>
          <div className="px-6 py-8 sm:px-12 sm:py-12" style={{ background: 'linear-gradient(#fff, #fff) padding-box' }}>
            <p className="mx-auto max-w-[620px] whitespace-pre-wrap text-[15.5px] leading-[1.85]" style={{ color: TEXT }}>{letter}</p>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-6">
          {error && <ErrorNote>{error}</ErrorNote>}
          <EmptyOutput tool="cover" Icon={PenLine} title="Your letter will show up here" copy="It uses this resume and job post. Takes about 15 seconds." />
        </div>
      )}
      {letter && error && <div className="px-4 pb-4 sm:px-6"><ErrorNote>{error}</ErrorNote></div>}
    </PanelLayout>
  )
}

/* ─── Cold outreach ─── */
export function OutreachPanel({
  access, status, result, loading, error, onGenerate, copied, onCopy,
  mode, onModeChange, recruiterName, onRecruiterName, companyName, onCompanyName,
}) {
  const t = TOOLS.outreach
  const dmLen = result?.linkedInDm?.length ?? 0
  return (
    <PanelLayout
      tool="outreach"
      brief={
        <Brief
          tool="outreach"
          title="Message the recruiter, not the void."
          description="A short cold email and a LinkedIn DM, both pointing at what you've built for this role."
          points={['Under 300 characters for LinkedIn', 'Names a real project from your resume', 'One clear ask at the end']}
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recruiter-name" className="text-[13.5px] font-medium" style={{ color: t.deep }}>
                Recruiter name <span className="font-normal opacity-75">(optional)</span>
              </Label>
              <Input id="recruiter-name" value={recruiterName} onChange={(e) => onRecruiterName(e.target.value)} placeholder="e.g. Priya" className={INPUT_CLASS} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-name" className="text-[13.5px] font-medium" style={{ color: t.deep }}>
                Company <span className="font-normal opacity-75">(optional)</span>
              </Label>
              <Input id="company-name" value={companyName} onChange={(e) => onCompanyName(e.target.value)} placeholder="e.g. Kestrel Pay" className={INPUT_CLASS} />
            </div>
            <div className="mt-2">
              <GenerateButton tool="outreach" access={access} hasResult={!!result} loading={loading} onClick={onGenerate} label="Write my messages" />
              <AccessNote tool="outreach" status={status} />
            </div>
          </div>
        </Brief>
      }
    >
      {loading ? (
        <div className="p-6 sm:p-8">
          <WritingSkeleton tool="outreach" label="Writing your email and DM" lines={[60, 0, 100, 92, 70, 0, 96, 55]} expected={12} />
        </div>
      ) : result ? (
        <Tabs value={mode} onValueChange={onModeChange} className="anim-fade-up gap-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6" style={{ borderColor: LINE }}>
            <TabsList aria-label="Message type" className="h-10 rounded-full bg-[#F1F3EF] p-1">
              <TabsTrigger value="email" className="rounded-full px-4 text-[14px] text-[#646A66] data-[active]:bg-white data-[active]:text-[#0D0F0E] data-[active]:shadow-[0_1px_2px_rgba(13,15,14,0.08)]">
                <Mail aria-hidden /> Email
              </TabsTrigger>
              <TabsTrigger value="dm" className="rounded-full px-4 text-[14px] text-[#646A66] data-[active]:bg-white data-[active]:text-[#0D0F0E] data-[active]:shadow-[0_1px_2px_rgba(13,15,14,0.08)]">
                <MessageSquare aria-hidden /> LinkedIn DM
              </TabsTrigger>
            </TabsList>
            <CopyBtn copied={copied} onClick={onCopy} label={mode === 'email' ? 'Copy email' : 'Copy DM'} />
          </div>

          <TabsContent value="email" className="px-5 py-6 sm:px-8 sm:py-8">
            <dl className="divide-y rounded-[14px] text-[14px]" style={{ boxShadow: `inset 0 0 0 1px ${LINE}`, borderColor: LINE }}>
              <div className="flex gap-3 px-4 py-2.5">
                <dt className="w-16 shrink-0" style={{ color: MUTED }}>To</dt>
                <dd className="min-w-0 truncate" style={{ color: INK }}>
                  {[recruiterName || 'Recruiter', companyName].filter(Boolean).join(', ')}
                </dd>
              </div>
              <div className="flex gap-3 px-4 py-2.5">
                <dt className="w-16 shrink-0" style={{ color: MUTED }}>Subject</dt>
                <dd className="min-w-0 font-medium" style={{ color: INK }}>{result.coldEmail.subject}</dd>
              </div>
            </dl>
            <p className="mt-6 whitespace-pre-wrap text-[15px] leading-[1.8]" style={{ color: TEXT }}>{result.coldEmail.body}</p>
          </TabsContent>

          <TabsContent value="dm" className="px-5 py-6 sm:px-8 sm:py-8">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-white" style={{ background: INK }}>You</span>
              <div className="min-w-0 max-w-[520px] rounded-[18px] rounded-tl-[6px] px-4 py-3.5" style={{ background: t.tint }}>
                <p className="whitespace-pre-wrap text-[15px] leading-[1.7]" style={{ color: INK }}>{result.linkedInDm}</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 pl-12">
              <div className="h-1.5 w-40 overflow-hidden rounded-full" style={{ background: MIST }} aria-hidden>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (dmLen / 300) * 100)}%`, background: dmLen > 300 ? '#F04438' : SUCCESS }} />
              </div>
              <span className="text-[12.5px] tabular-nums" style={{ color: dmLen > 300 ? '#B42318' : MUTED }}>{dmLen} / 300 characters</span>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="p-4 sm:p-6">
          {error && <ErrorNote>{error}</ErrorNote>}
          <EmptyOutput tool="outreach" Icon={Send} title="Your email and DM will show up here" copy="Add the recruiter's name if you know it. Takes about 10 seconds." />
        </div>
      )}
      {result && error && <div className="px-4 pb-4 sm:px-6"><ErrorNote>{error}</ErrorNote></div>}
    </PanelLayout>
  )
}

/* ─── Interview prep ─── */
const CATS = ['Behavioral', 'Technical', 'Situational']

function QuestionList({ questions }) {
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(['q0'])
  const t = TOOLS.interview
  const indexed = questions.map((q, i) => ({ ...q, id: `q${i}`, n: i + 1 }))
  const filters = [{ value: 'all', label: 'All', items: indexed }, ...CATS.map((c) => ({ value: c, label: c, items: indexed.filter((q) => q.category === c) }))]
    .filter((f) => f.value === 'all' || f.items.length)

  return (
    <Tabs value={filter} onValueChange={setFilter} className="anim-fade-up gap-0">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
        <p className="text-[16px] font-medium" style={{ color: INK }}>{questions.length} questions for this role</p>
        <button
          onClick={() => setOpen(open.length ? [] : indexed.map((q) => q.id))}
          className="rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-[#F4F6F2]"
          style={{ color: t.deep }}
        >
          {open.length ? 'Hide all tips' : 'Show all tips'}
        </button>
      </div>
      <TabsList
        variant="line"
        aria-label="Filter questions by type"
        className="mt-2 flex w-full justify-start gap-5 overflow-x-auto border-b-0 px-4 shadow-[inset_0_-1px_0_#E3E6E1] sm:px-6 [scrollbar-width:none]"
      >
        {filters.map((f) => (
          <TabsTrigger key={f.value} value={f.value} className="flex-none text-[14px] focus-visible:ring-0 group-data-[variant=line]/tabs-list:mb-0 group-data-[variant=line]/tabs-list:h-11 group-data-[variant=line]/tabs-list:px-1">
            {f.label}
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[12px] font-medium tabular-nums"
              style={filter === f.value ? { background: t.tint, color: t.deep } : { background: MIST, color: MUTED }}>
              {f.items.length}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      {filters.map((f) => (
        <TabsContent key={f.value} value={f.value} tabIndex={-1}>
          <Accordion multiple value={open} onValueChange={setOpen}>
            {f.items.map((q) => {
              const isOpen = open.includes(q.id)
              return (
                <AccordionItem key={q.id} value={q.id} className="border-b border-[#E3E6E1] last:border-b-0">
                  <AccordionTrigger className="gap-0 px-4 py-4 hover:bg-[#F4F6F2]/60 focus-visible:ring-0 sm:px-6 sm:py-5 [&>[data-slot=accordion-trigger-icon]]:hidden">
                    <span className="flex min-w-0 flex-1 flex-col gap-2.5">
                      <span className="flex items-center gap-2.5">
                        <span className="text-[13px] font-medium tabular-nums" style={{ color: MUTED }}>Q{q.n}</span>
                        <span className="inline-flex h-6 items-center rounded-full px-2.5 text-[12.5px] font-medium" style={{ background: t.tint, color: t.deep }}>{q.category}</span>
                        <span className={cn('ml-auto inline-flex h-7 shrink-0 items-center gap-1 rounded-full border pl-2.5 pr-2 text-[13px] font-medium transition-colors',
                          isOpen ? 'border-transparent bg-[#F4F6F2] text-[#0D0F0E]' : 'border-[#E3E6E1] bg-white text-[#3B403D]')}>
                          {isOpen ? 'Hide tip' : 'Show tip'}
                          <ChevronDown aria-hidden className={cn('size-3.5 transition-transform duration-200', isOpen && 'rotate-180')} />
                        </span>
                      </span>
                      <span className="block text-[15px] font-medium leading-[1.5] tracking-[-0.01em] sm:text-[16px]" style={{ color: INK }}>{q.question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 sm:px-6 sm:pb-5">
                    <div className="rounded-[12px] px-4 py-3.5" style={{ background: MIST }}>
                      <p className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: t.deep }}>
                        <FileUser aria-hidden className="size-4" style={{ color: t.strong }} /> Tip from your resume
                      </p>
                      <p className="mt-1.5 text-[14px] leading-[1.6] sm:text-[15px]" style={{ color: TEXT }}>{q.tip}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </TabsContent>
      ))}
      <p className="border-t px-4 py-3 text-[13.5px] leading-[1.5] sm:px-6" style={{ borderColor: LINE, background: MIST, color: MUTED }}>
        <span className="font-medium" style={{ color: INK }}>Practice mode.</span> Say your answer out loud first, then open the tip to check what you missed.
      </p>
    </Tabs>
  )
}

export function InterviewPanel({ access, status, questions, loading, error, onGenerate }) {
  return (
    <PanelLayout
      tool="interview"
      brief={
        <Brief
          tool="interview"
          title="Practice the questions this job will ask."
          description="6 to 8 questions written for this role, each with a tip on which of your projects to bring up."
          points={['Behavioral, technical and situational', 'Tips point at your own resume', 'Answer out loud, then check the tip']}
        >
          <GenerateButton tool="interview" access={access} hasResult={!!questions} loading={loading} onClick={onGenerate} label="Get my questions" />
          <AccessNote tool="interview" status={status} />
        </Brief>
      }
    >
      {loading ? (
        <div className="p-6 sm:p-8">
          <WritingSkeleton tool="interview" label="Writing your questions" lines={[40, 100, 80, 0, 40, 96, 70, 0, 40, 90]} expected={15} />
        </div>
      ) : questions ? (
        <QuestionList questions={questions} />
      ) : (
        <div className="p-4 sm:p-6">
          {error && <ErrorNote>{error}</ErrorNote>}
          <EmptyOutput tool="interview" Icon={Mic} title="Your questions will show up here" copy="Written from this job post, with tips from your resume. Takes about 15 seconds." />
        </div>
      )}
      {questions && error && <div className="px-4 pb-4 sm:px-6"><ErrorNote>{error}</ErrorNote></div>}
    </PanelLayout>
  )
}

/* ─── After the report: what to do next ─── */
export function NextSteps({ onPick, statusFor }) {
  const items = [
    { id: 'cover', copy: 'Turn this match into a letter.' },
    { id: 'outreach', copy: 'Reach the recruiter directly.' },
    { id: 'interview', copy: 'Prep for the call you’ll get.' },
  ]
  return (
    <section className="no-print">
      <h2 className="text-[22px] font-medium" style={{ color: INK, letterSpacing: '-0.03em' }}>Ready to apply? Use the same resume and job post.</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {items.map(({ id, copy }) => {
          const t = TOOLS[id]
          const Icon = TOOL_ICONS[id]
          return (
            <button
              key={id}
              onClick={() => onPick(id)}
              className="group flex flex-col rounded-[22px] p-5 text-left transition-transform duration-200 hover:-translate-y-0.5"
              style={{ background: t.tint }}
            >
              <span className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-[12px] bg-white" style={{ color: t.deep }}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: t.deep }} aria-hidden />
              </span>
              <span className="mt-5 text-[16px] font-medium" style={{ color: INK }}>{t.name}</span>
              <span className="mt-1 text-[14px]" style={{ color: t.deep }}>{copy}</span>
              {statusFor(id) && <span className="mt-3 text-[12.5px] font-medium" style={{ color: t.deep }}>{statusFor(id)}</span>}
            </button>
          )
        })}
      </div>
    </section>
  )
}
