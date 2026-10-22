'use client'

import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { motion, useAnimate } from 'framer-motion'
import { Briefcase, Check, Copy, FileText, TriangleAlert, UserRound } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { PrimaryButton, SectionHeader, Stage, Surface, useInView, useReducedMotion } from '@/components/landing/primitives'
import { DANGER, INK, LINE, MIST, MUTED, PERSONA, SUCCESS, TEXT, TOOLS } from '@/components/landing/tokens'

const TOOL = TOOLS.outreach
const LIMIT = 280
// DANGER is 3.8:1 on white, too light for 13px text. Same red, one step darker (4.8:1).
const DANGER_TEXT = '#D92D20'
const EASE = [0.22, 1, 0.36, 1]

const FLASH = {
  light: ['rgba(255,122,69,0.32)', 'rgba(255,122,69,0)'],
  dark: ['rgba(255,122,69,0.6)', 'rgba(255,122,69,0)'],
}

const INPUT_CLASS =
  'h-11 rounded-[10px] border-[#E3E6E1] bg-white px-3.5 text-[16px] text-[#0D0F0E] shadow-[0_1px_2px_rgba(13,15,14,0.04)] transition-[border-color,box-shadow] placeholder:text-[#646A66] hover:border-[#D5D9D3] focus-visible:border-[#0D0F0E] focus-visible:ring-4 focus-visible:ring-[#0D0F0E]/10 md:text-[15px]'

// Both panels share one grid cell so switching tabs crossfades instead of stacking.
const PANEL_CLASS =
  'col-start-1 row-start-1 flex min-w-0 flex-col transition-opacity duration-200 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0D0F0E]'

const NOTES = [
  { icon: UserRound, text: 'Uses the recruiter name and company you type. Both are optional.' },
  { icon: FileText, text: 'Pulls your projects and experience from your resume.' },
  { icon: Briefcase, text: 'Ties the message to the role in the job post.' },
]

/* ---------- text helpers ---------- */

const HONORIFIC = /^(mr|mrs|ms|miss|mx|dr|prof)\.?\s+/i
const tidy = (value) => value.trim().replace(/\s+/g, ' ')
const firstNameOf = (fullName) => fullName.replace(HONORIFIC, '').split(' ')[0] || ''
const firstChar = (word) => Array.from(word)[0] || ''

function initialsOf(fullName) {
  const parts = fullName.replace(HONORIFIC, '').split(' ').filter(Boolean)
  if (!parts.length) return ''
  const last = parts.length > 1 ? firstChar(parts[parts.length - 1]) : ''
  return (firstChar(parts[0]) + last).toUpperCase()
}

// A draft is a list of pieces: plain strings, or { text } tokens filled in from the inputs.
function buildDrafts(firstName, company) {
  const name = { text: firstName || 'there' }
  const co = { text: company || 'your team' }
  return {
    subject: ["Frontend fresher who's shipped React apps, interested in ", co],
    body: [
      ['Hi ', name, ','],
      [
        'I saw that ',
        co,
        " is hiring a Frontend Developer (fresher) to build the merchant dashboard in React and TypeScript. I'm a final-year B.Tech CSE student in Bengaluru, and most of what I've built is in React.",
      ],
      [
        'I built CampusCart, a marketplace for students at my college, with React and Node.js, and FestHub, the React site for our college fest, which [X] students used. The code for both is on my GitHub. During a 2-month frontend internship at Juniper Health, I shipped [X] screens to production.',
      ],
      [
        "Would you be open to a 15-minute chat next week? I'd like to hear what you look for in a fresher, and I'm happy to walk you through CampusCart.",
      ],
    ],
    signature: ['Thanks,', PERSONA.name, `github.com/${PERSONA.github}`],
    dm: [
      'Hi ',
      name,
      ", I'm Aditi, a final-year CSE student in Bengaluru. I saw ",
      co,
      " is hiring a frontend fresher for the merchant dashboard. I've built two React apps, CampusCart and FestHub, and interned at Juniper Health. Would you be open to a 15-minute chat next week?",
    ],
  }
}

const toPlain = (pieces) => pieces.map((p) => (typeof p === 'string' ? p : p.text)).join('')

async function writeClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Permission denied or unsupported: try the older copy path below.
  }
  try {
    const previous = document.activeElement
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.top = '0'
    area.style.left = '0'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    if (previous && typeof previous.focus === 'function') previous.focus()
    return ok
  } catch {
    return false
  }
}

function useMeasuredHeight() {
  const ref = useRef(null)
  const [height, setHeight] = useState(null)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, height]
}

/* ---------- small pieces ---------- */

// Words that come from the inputs. They flash softly when you change them, never on first render.
function Token({ text, tone = 'light' }) {
  const [scope, animate] = useAnimate()
  const reduce = useReducedMotion()
  const previous = useRef(text)
  useEffect(() => {
    if (previous.current === text) return
    previous.current = text
    if (reduce || !scope.current) return
    animate(scope.current, { backgroundColor: FLASH[tone] }, { duration: 0.9, ease: 'easeOut' })
  }, [text, tone, reduce, animate, scope])
  return (
    <span ref={scope} className="rounded-[3px]">
      {text}
    </span>
  )
}

function Placeholder() {
  return (
    <span
      className="whitespace-nowrap rounded-[4px] border border-dashed px-[3px] font-medium"
      style={{ color: INK, background: MIST, borderColor: '#AEB4AD' }}
    >
      [X]
    </span>
  )
}

function withPlaceholders(text) {
  return text.split('[X]').map((part, i) => (
    <Fragment key={i}>
      {i > 0 && <Placeholder />}
      {part}
    </Fragment>
  ))
}

function Rich({ pieces, tone }) {
  return pieces.map((piece, i) =>
    typeof piece === 'string' ? (
      <Fragment key={i}>{withPlaceholders(piece)}</Fragment>
    ) : (
      <Token key={i} text={piece.text} tone={tone} />
    )
  )
}

// Renders the DM and marks anything past the limit, the way a composer would.
function DmText({ pieces }) {
  let used = 0
  const within = []
  let overflow = ''
  pieces.forEach((piece, i) => {
    const text = typeof piece === 'string' ? piece : piece.text
    const chars = Array.from(text)
    const room = Math.max(LIMIT - used, 0)
    used += chars.length
    if (chars.length <= room) {
      within.push(typeof piece === 'string' ? <Fragment key={i}>{text}</Fragment> : <Token key={i} text={text} tone="dark" />)
    } else {
      if (room > 0) within.push(<Fragment key={i}>{chars.slice(0, room).join('')}</Fragment>)
      overflow += chars.slice(room).join('')
    }
  })
  return (
    <>
      {within}
      {overflow && (
        <mark className="rounded-[3px] text-white" style={{ background: 'rgba(240,68,56,0.6)' }}>
          {overflow}
        </mark>
      )}
    </>
  )
}

function Avatar({ initials, small = false }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-medium',
        small ? 'size-6 text-[10px]' : 'size-10 text-[14px]'
      )}
      style={{ background: TOOL.tint, color: TOOL.deep }}
    >
      {initials || <UserRound className={small ? 'size-3.5' : 'size-[18px]'} />}
    </span>
  )
}

function CountRing({ count }) {
  const r = 8
  const circumference = 2 * Math.PI * r
  const ratio = Math.min(count / LIMIT, 1)
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-5 shrink-0 -rotate-90">
      <circle cx="10" cy="10" r={r} fill="none" stroke={LINE} strokeWidth="2.5" />
      <circle
        cx="10"
        cy="10"
        r={r}
        fill="none"
        stroke={count > LIMIT ? DANGER : SUCCESS}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
        className="transition-[stroke-dashoffset,stroke] duration-300 motion-reduce:transition-none"
      />
    </svg>
  )
}

function CopyLabel({ show, children }) {
  return (
    <span className={cn('col-start-1 row-start-1 inline-flex items-center justify-center gap-1.5', !show && 'invisible')}>
      {children}
    </span>
  )
}

function CopyButton({ label, status, onClick }) {
  return (
    <PrimaryButton
      type="button"
      onClick={onClick}
      className="h-9 shrink-0 px-4 text-[14px] shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_2px_6px_-2px_rgba(13,15,14,0.4)]"
    >
      {/* All labels share one cell so the button never changes width. */}
      <span className="inline-grid">
        <CopyLabel show={status === 'idle'}>
          <Copy aria-hidden className="size-4" />
          {label}
        </CopyLabel>
        <CopyLabel show={status === 'copied'}>
          <Check aria-hidden className="size-4" />
          Copied
        </CopyLabel>
        <CopyLabel show={status === 'failed'}>Copy failed</CopyLabel>
      </span>
    </PrimaryButton>
  )
}

function Field({ id, label, ...props }) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={id} className="text-[13px] leading-none" style={{ color: TEXT }}>
        {label}
      </Label>
      <Input id={id} type="text" autoComplete="off" spellCheck={false} maxLength={40} className={INPUT_CLASS} {...props} />
    </div>
  )
}

function SourceRow({ icon: Icon, title, caption }) {
  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-white"
        style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }}
      >
        <Icon className="size-4" style={{ color: MUTED }} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium" style={{ color: INK }}>
          {title}
        </span>
        <span className="block text-[12px]" style={{ color: MUTED }}>
          {caption}
        </span>
      </span>
    </li>
  )
}

/* ---------- section ---------- */

export default function OutreachSection() {
  const [name, setName] = useState('Priya')
  const [company, setCompany] = useState(PERSONA.company)
  const [tab, setTab] = useState('email')
  const [copy, setCopy] = useState({ key: null, status: 'idle' })
  const timer = useRef(null)

  const nameId = useId()
  const companyId = useId()
  const reduce = useReducedMotion()
  const [revealRef, inView] = useInView({ threshold: 0.15 })
  const [measureRef, panelHeight] = useMeasuredHeight()

  useEffect(() => {
    const pending = timer
    return () => clearTimeout(pending.current)
  }, [])

  const fullName = tidy(name)
  const companyName = tidy(company)
  const initials = initialsOf(fullName)
  const drafts = buildDrafts(firstNameOf(fullName), companyName)

  const emailText = `Subject: ${toPlain(drafts.subject)}\n\n${[
    ...drafts.body.map(toPlain),
    drafts.signature.join('\n'),
  ].join('\n\n')}`
  const dmText = toPlain(drafts.dm)
  const dmCount = Array.from(dmText).length
  const overLimit = dmCount > LIMIT

  const toLabel = fullName || (companyName ? `Recruiter at ${companyName}` : 'Recruiter')
  const recipientTitle = companyName ? `Talent Acquisition, ${companyName}` : 'Talent Acquisition'

  const statusFor = (key) => (copy.key === key ? copy.status : 'idle')

  // The copied text no longer matches once the inputs change.
  const resetCopy = () => {
    clearTimeout(timer.current)
    setCopy((current) => (current.status === 'idle' ? current : { key: null, status: 'idle' }))
  }

  const handleCopy = async (key) => {
    clearTimeout(timer.current)
    const ok = await writeClipboard(key === 'email' ? emailText : dmText)
    setCopy({ key, status: ok ? 'copied' : 'failed' })
    timer.current = setTimeout(() => setCopy({ key: null, status: 'idle' }), ok ? 2000 : 4000)
  }

  const liveMessage =
    copy.status === 'copied'
      ? `${copy.key === 'email' ? 'Email' : 'DM'} copied to your clipboard.`
      : copy.status === 'failed'
        ? 'Couldn’t copy. Select the text and copy it yourself.'
        : ''

  const failedNote = (
    <p className="text-[13px] leading-[1.5]" style={{ color: DANGER_TEXT }}>
      Your browser blocked copying. Select the text and copy it yourself.
    </p>
  )

  return (
    <section id="tool-outreach" data-tool="outreach" className="scroll-mt-28">
      <SectionHeader
        tool="outreach"
        title="Skip the applicant pile. Message the recruiter."
        description="ResumeMax writes a cold email and a LinkedIn DM from your resume and the job post. Add the recruiter’s name and company if you have them, then copy whichever one you need."
      />

      <motion.div
        ref={revealRef}
        className="mt-10 sm:mt-12"
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: reduce ? 0 : 0.55, ease: EASE }}
      >
        <Stage tool="outreach">
          <Surface className="overflow-hidden lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
            {/* Inputs */}
            <div
              className="border-b p-4 sm:p-6 lg:border-b-0 lg:border-r"
              style={{ background: MIST, borderColor: LINE }}
            >
              <h3 className="text-[15px] font-medium tracking-[-0.01em]" style={{ color: INK }}>
                Who you’re writing to
              </h3>
              <p className="mt-1 text-[13px] leading-[1.5]" style={{ color: MUTED }}>
                Both are optional. Change them and both drafts update.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <Field
                  id={nameId}
                  label="Recruiter name"
                  value={name}
                  placeholder={`e.g. ${PERSONA.recruiter}`}
                  onChange={(e) => {
                    setName(e.target.value)
                    resetCopy()
                  }}
                />
                <Field
                  id={companyId}
                  label="Company"
                  value={company}
                  placeholder={`e.g. ${PERSONA.company}`}
                  onChange={(e) => {
                    setCompany(e.target.value)
                    resetCopy()
                  }}
                />
              </div>
              <div className="mt-6 hidden border-t pt-5 lg:block" style={{ borderColor: LINE }}>
                <h4 className="text-[13px] font-medium" style={{ color: TEXT }}>
                  Also written from
                </h4>
                <ul className="mt-3 space-y-3">
                  <SourceRow icon={FileText} title="Aditi_Sharma_Resume.pdf" caption="Your resume" />
                  <SourceRow icon={Briefcase} title="Frontend Developer (fresher)" caption="The job post" />
                </ul>
              </div>
            </div>

            {/* Drafts */}
            <Tabs value={tab} onValueChange={setTab} className="min-w-0 gap-0">
              <div className="border-b px-4 py-3 sm:px-6" style={{ borderColor: LINE }}>
                <TabsList aria-label="Draft type" className="h-10 w-full sm:w-fit">
                  <TabsTrigger value="email" className="px-4 text-[14px]">
                    Cold email
                  </TabsTrigger>
                  <TabsTrigger value="dm" className="px-4 text-[14px]">
                    LinkedIn DM
                  </TabsTrigger>
                </TabsList>
              </div>

              <motion.div
                initial={false}
                animate={panelHeight == null ? undefined : { height: panelHeight }}
                transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
                className="overflow-hidden"
              >
                <div ref={measureRef} className="grid">
                  <TabsContent value="email" className={PANEL_CLASS}>
                    <dl className="px-4 sm:px-6">
                      <div className="flex items-center gap-3 border-b py-3" style={{ borderColor: LINE }}>
                        <dt className="w-[52px] shrink-0 text-[13px]" style={{ color: MUTED }}>
                          To
                        </dt>
                        <dd className="min-w-0">
                          <span
                            className="inline-flex max-w-full items-center gap-2 rounded-full py-1 pl-1 pr-3"
                            style={{ background: MIST, boxShadow: `inset 0 0 0 1px ${LINE}` }}
                          >
                            <Avatar initials={initials} small />
                            <span className="truncate text-[13px] font-medium" style={{ color: INK }}>
                              {toLabel}
                            </span>
                          </span>
                        </dd>
                      </div>
                      <div className="flex gap-3 border-b py-3" style={{ borderColor: LINE }}>
                        <dt className="w-[52px] shrink-0 pt-px text-[13px] leading-[1.5]" style={{ color: MUTED }}>
                          Subject
                        </dt>
                        <dd
                          className="min-w-0 text-[14px] font-medium leading-[1.5] [overflow-wrap:anywhere] sm:text-[15px]"
                          style={{ color: INK }}
                        >
                          <Rich pieces={drafts.subject} tone="light" />
                        </dd>
                      </div>
                    </dl>

                    <div
                      className="space-y-3.5 px-4 py-5 text-[15px] leading-[1.7] [overflow-wrap:anywhere] sm:px-6"
                      style={{ color: TEXT }}
                    >
                      {drafts.body.map((pieces, i) => (
                        <p key={i}>
                          <Rich pieces={pieces} tone="light" />
                        </p>
                      ))}
                      <p>
                        {drafts.signature.map((line, i) => (
                          <Fragment key={line}>
                            {i > 0 && <br />}
                            {line}
                          </Fragment>
                        ))}
                      </p>
                    </div>

                    <div
                      className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t px-4 py-3 sm:px-6"
                      style={{ borderColor: LINE }}
                    >
                      <div className="min-w-0 flex-1 basis-[220px]">
                        {statusFor('email') === 'failed' ? (
                          failedNote
                        ) : (
                          <p className="text-[13px] leading-[1.5]" style={{ color: MUTED }}>
                            Swap each <Placeholder /> for your real number before you send.
                          </p>
                        )}
                      </div>
                      <CopyButton label="Copy email" status={statusFor('email')} onClick={() => handleCopy('email')} />
                    </div>
                  </TabsContent>

                  <TabsContent value="dm" className={PANEL_CLASS}>
                    <div className="flex items-center gap-3 border-b px-4 py-3 sm:px-6" style={{ borderColor: LINE }}>
                      <Avatar initials={initials} />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-medium" style={{ color: INK }}>
                          {fullName || 'Recruiter'}
                        </p>
                        <p className="truncate text-[13px]" style={{ color: MUTED }}>
                          {recipientTitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-end px-4 py-6 sm:px-6 lg:min-h-[248px]">
                      <p
                        className="ml-auto max-w-[88%] rounded-[12px] rounded-br-[4px] px-4 py-3 text-[14.5px] leading-[1.6] text-white [overflow-wrap:anywhere]"
                        style={{ background: INK }}
                      >
                        <DmText pieces={drafts.dm} />
                      </p>
                    </div>

                    <div
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t px-4 py-3 sm:px-6"
                      style={{ borderColor: LINE }}
                    >
                      <div className="min-w-0 flex-1 basis-[200px] space-y-1.5">
                        <div aria-live="polite" className="space-y-1.5">
                          <p
                            aria-atomic="true"
                            className="flex items-center gap-2 text-[13px] font-medium tabular-nums"
                            style={{ color: overLimit ? DANGER_TEXT : TEXT }}
                          >
                            <CountRing count={dmCount} />
                            {dmCount} / {LIMIT}
                            <span className="sr-only"> characters</span>
                          </p>
                          {overLimit && (
                            <p className="flex items-start gap-1.5 text-[13px] leading-[1.45]" style={{ color: DANGER_TEXT }}>
                              <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                              Over the 280 character limit. Trim before sending.
                            </p>
                          )}
                        </div>
                        {statusFor('dm') === 'failed' && failedNote}
                      </div>
                      <CopyButton label="Copy DM" status={statusFor('dm')} onClick={() => handleCopy('dm')} />
                    </div>
                  </TabsContent>
                </div>
              </motion.div>
            </Tabs>
          </Surface>
        </Stage>

        <ul className="mt-6 grid gap-x-8 gap-y-3 md:grid-cols-3">
          {NOTES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex gap-2.5 text-[14px] leading-[1.55]" style={{ color: TEXT }}>
              <Icon aria-hidden className="mt-[3px] size-4 shrink-0" style={{ color: TOOL.deep }} />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <p aria-live="polite" className="sr-only">
        {liveMessage}
      </p>
    </section>
  )
}
