'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, FileText, FileUser, Gauge } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { SectionHeader, Stage, Surface, useInView, useReducedMotion } from '@/components/landing/primitives'
import { INK, TEXT, MUTED, LINE, MIST, TOOLS } from '@/components/landing/tokens'

const TOOL = TOOLS.interview
const EASE = [0.22, 1, 0.36, 1]

// A resume item named inside a tip, so it's obvious the advice comes from Aditi's own resume.
function R({ children }) {
  return (
    <span className="font-medium" style={{ color: INK }}>
      {children}
    </span>
  )
}

const QUESTIONS = [
  {
    id: 'q1',
    n: 1,
    category: 'Behavioral',
    question:
      'Every pull request at Kestrel Pay gets reviewed before it ships. Tell me about a time someone asked you to change your code. What did you do?',
    tip: (
      <>
        Pick a pull request from your <R>Juniper Health internship</R> and use STAR: what you built, what the
        reviewer flagged, what you changed. Finish with the habit you kept afterwards, since that’s what
        they’re really listening for.
      </>
    ),
  },
  {
    id: 'q2',
    n: 2,
    category: 'Behavioral',
    question:
      'Payment features often go live on a fixed date. Tell me about a time you had a hard deadline and couldn’t build everything you planned.',
    tip: (
      <>
        <R>FestHub</R> had to be live before the fest, so use it here. Tell it in STAR order, focus on what you
        cut or simplified to launch on time, and keep the result honest, like [X] students using the site.
      </>
    ),
  },
  {
    id: 'q3',
    n: 3,
    category: 'Technical',
    question:
      'Our merchant dashboard lists transactions from a paginated REST API. How would you build that screen in React and TypeScript, including the loading, error and empty states?',
    tip: (
      <>
        Answer with <R>CampusCart</R>: its React frontend calls your own Node.js API, so you can talk about REST
        from real experience. Walk through one screen’s loading, error and empty states, then show how you’d
        type a transaction in TypeScript.
      </>
    ),
  },
  {
    id: 'q4',
    n: 4,
    category: 'Technical',
    question:
      'When would you keep state inside a component, and when would you move it into Redux? Use the dashboard’s date range filter as your example.',
    tip: (
      <>
        If Redux is new to you, say so, then reason it through with <R>CampusCart</R>: which state many pages
        needed, like the cart or the signed-in user, and which stayed inside one form. Finish by applying the
        same rule to the date filter.
      </>
    ),
  },
  {
    id: 'q5',
    n: 5,
    category: 'Situational',
    question:
      'A merchant refunds an order, but the dashboard still shows it as pending until they refresh the page. How would you track down the cause?',
    tip: (
      <>
        Talk through your steps in order: the API response in the Network tab first, then whether the app’s
        state updates after the refund. Back it up with a real bug you chased between <R>CampusCart</R>’s
        React app and its Node.js API.
      </>
    ),
  },
  {
    id: 'q6',
    n: 6,
    category: 'Situational',
    question:
      'The Figma design for a new payouts page has no mobile layout and no empty state. What do you do before you start building?',
    tip: (
      <>
        Say you’d list the missing states and agree on them with the designer before writing code, so nothing
        gets rebuilt later. Mention how design handoffs worked during your <R>Juniper Health internship</R> to
        show you’ve done this with a real team.
      </>
    ),
  },
]

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'Behavioral', label: 'Behavioral' },
  { value: 'Technical', label: 'Technical' },
  { value: 'Situational', label: 'Situational' },
].map((f) => ({
  ...f,
  items: f.value === 'all' ? QUESTIONS : QUESTIONS.filter((q) => q.category === f.value),
}))

const NOTES = [
  { icon: FileText, text: 'Questions come from the job post you paste, never from a generic list.' },
  { icon: FileUser, text: 'Every tip points to a real project, skill or experience on your resume.' },
  {
    icon: Gauge,
    text: 'Difficulty matches the role, so a job that mentions system design gets a deeper technical question.',
  },
]

function QuestionRow({ q, open, revealed, transition }) {
  return (
    <motion.div
      className="border-b border-[#E3E6E1] last:border-b-0"
      initial={{ opacity: 0, y: 8 }}
      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={transition}
    >
      <AccordionItem value={q.id} className="border-b-0">
        <AccordionTrigger className="gap-0 px-4 py-4 hover:bg-[#F4F6F2]/60 focus-visible:ring-0 focus-visible:!outline-offset-[-2px] sm:px-6 sm:py-[18px] [&>[data-slot=accordion-trigger-icon]]:hidden">
          <span className="flex min-w-0 flex-1 flex-col gap-2.5">
            <span className="flex items-center gap-2.5">
              <span className="text-[13px] font-medium tabular-nums" style={{ color: MUTED }}>
                Q{q.n}
              </span>
              <span
                className="inline-flex h-6 items-center rounded-full px-2.5 text-[12.5px] font-medium"
                style={{ background: TOOL.tint, color: TOOL.deep }}
              >
                {q.category}
              </span>
              <span
                className={cn(
                  'ml-auto inline-flex h-7 shrink-0 items-center gap-1 rounded-full border pl-2.5 pr-2 text-[13px] font-medium transition-colors',
                  open
                    ? 'border-transparent bg-[#F4F6F2] text-[#0D0F0E]'
                    : 'border-[#E3E6E1] bg-white text-[#3B403D] group-hover/accordion-trigger:border-[#D5D9D3] group-hover/accordion-trigger:text-[#0D0F0E]'
                )}
              >
                {open ? 'Hide tip' : 'Show tip'}
                <ChevronDown
                  aria-hidden
                  className={cn('size-3.5 transition-transform duration-200', open && 'rotate-180')}
                />
              </span>
            </span>
            <span
              className="block text-[15px] font-medium leading-[1.5] tracking-[-0.01em] sm:text-[16px]"
              style={{ color: INK }}
            >
              {q.question}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent
          className="px-4 pb-4 sm:px-6 sm:pb-5"
          style={{ transitionDuration: '280ms', transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          <div className="rounded-[12px] px-4 py-3.5" style={{ background: MIST }}>
            <p className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: TOOL.deep }}>
              <FileUser aria-hidden className="size-4" style={{ color: TOOL.strong }} />
              Tip from your resume
            </p>
            <p className="mt-1.5 text-[14px] leading-[1.6] sm:text-[15px]" style={{ color: TEXT }}>
              {q.tip}
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </motion.div>
  )
}

export default function InterviewSection() {
  const [listRef, inView] = useInView({ threshold: 0.1 })
  const reduceMotion = useReducedMotion()
  const [filter, setFilter] = useState('all')
  // After the first filter change, rows re-enter quicker so the filter feels instant.
  const [hasFiltered, setHasFiltered] = useState(false)
  // Shared across tabs, so a tip you opened under "All" is still open under its category.
  const [openTips, setOpenTips] = useState([])

  const rowTransition = (i) => {
    if (reduceMotion) return { duration: 0 }
    return hasFiltered
      ? { duration: 0.22, delay: i * 0.03, ease: EASE }
      : { duration: 0.34, delay: i * 0.05, ease: EASE }
  }

  return (
    <section id="tool-interview" data-tool="interview" className="scroll-mt-28">
      <SectionHeader
        tool="interview"
        title="Practice the questions this job will actually ask."
        description="Paste the job post and get 6 to 8 questions written for that role, sorted into behavioral, technical and situational. Each one comes with a tip on which of your own projects to bring up and how to frame it."
      />

      <Stage tool="interview" className="mt-8 sm:mt-10">
        <div ref={listRef}>
          <Surface className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
              <div className="min-w-0">
                <p
                  className="text-[16px] font-medium leading-snug tracking-[-0.01em] sm:text-[17px]"
                  style={{ color: INK }}
                >
                  Frontend Developer, fresher
                </p>
                <p className="mt-0.5 text-[14px]" style={{ color: MUTED }}>
                  Kestrel Pay, Bengaluru
                </p>
              </div>
              <p className="text-[14px] tabular-nums sm:pt-0.5" style={{ color: TEXT }}>
                {QUESTIONS.length} questions
              </p>
            </div>

            <Tabs
              value={filter}
              onValueChange={(value) => {
                setFilter(value)
                setHasFiltered(true)
              }}
              className="gap-0"
            >
              <TabsList
                variant="line"
                activateOnFocus
                aria-label="Filter questions by type"
                className="flex w-full justify-start gap-5 overflow-x-auto border-b-0 px-3 shadow-[inset_0_-1px_0_#E3E6E1] sm:px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {FILTERS.map((f) => {
                  const active = f.value === filter
                  return (
                    <TabsTrigger
                      key={f.value}
                      value={f.value}
                      className="flex-none text-[14px] focus-visible:ring-0 focus-visible:!outline-offset-[-2px] group-data-[variant=line]/tabs-list:mb-0 group-data-[variant=line]/tabs-list:h-11 group-data-[variant=line]/tabs-list:px-1"
                    >
                      {f.label}
                      <span
                        className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[12px] font-medium tabular-nums transition-colors"
                        style={active ? { background: TOOL.tint, color: TOOL.deep } : { background: MIST, color: MUTED }}
                      >
                        {f.items.length}
                      </span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {FILTERS.map((f) => (
                <TabsContent key={f.value} value={f.value} tabIndex={-1}>
                  <Accordion multiple value={openTips} onValueChange={(value) => setOpenTips(value)}>
                    {f.items.map((q, i) => (
                      <QuestionRow
                        key={q.id}
                        q={q}
                        open={openTips.includes(q.id)}
                        revealed={inView}
                        transition={rowTransition(i)}
                      />
                    ))}
                  </Accordion>
                </TabsContent>
              ))}
            </Tabs>

            <p
              className="border-t px-4 py-3 text-[13.5px] leading-[1.5] sm:px-6"
              style={{ borderColor: LINE, background: MIST, color: MUTED }}
            >
              <span className="font-medium" style={{ color: INK }}>
                Practice mode.
              </span>{' '}
              Say your answer out loud first, then open the tip to check what you missed.
            </p>
          </Surface>
        </div>
      </Stage>

      <ul className="mt-6 grid gap-x-8 gap-y-3 sm:mt-8 sm:grid-cols-3">
        {NOTES.map(({ icon: Icon, text }) => (
          <li key={text} className="flex gap-2.5 text-[14.5px] leading-[1.55]" style={{ color: MUTED }}>
            <Icon aria-hidden className="mt-[3px] size-4 shrink-0" style={{ color: TOOL.deep }} />
            {text}
          </li>
        ))}
      </ul>
    </section>
  )
}
