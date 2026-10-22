'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check, Copy, Download } from 'lucide-react'
import { Spinner } from '@/components/landing/Loader'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { SectionHeader, Stage, Surface, SecondaryButton, useInView } from '@/components/landing/primitives'
import { INK, TEXT, MUTED, LINE, MIST, TOOLS, PERSONA } from '@/components/landing/tokens'

const T = TOOLS.cover
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

// Words the letter mirrors from the (sample) job post, with the line each one came from.
const KW = {
  dashboard: { text: 'merchant dashboard', quote: 'Build new features for our merchant dashboard' },
  typescript: { text: 'TypeScript', quote: 'Write clean, typed code in TypeScript' },
  rest: { text: 'REST APIs', quote: 'Integrate REST APIs with the backend team' },
  tests: { text: 'unit tests', quote: 'Write unit tests for the components you ship' },
  react: { text: 'React', quote: 'Strong fundamentals in React' },
  responsive: { text: 'responsive UI', quote: 'Build responsive UI that works on any screen' },
}
// A number only the student knows. The letter leaves it blank instead of guessing.
const X = { placeholder: true }

const PARTS = [
  { label: 'Opening hook', desc: 'Why this company, before anything else.' },
  { label: 'Relevant experience', desc: 'Your internship and projects that match the post.' },
  { label: 'Specific value', desc: 'What you’d bring to their team.' },
  { label: 'Closing', desc: 'A next step they can say yes to.' },
]

const PARAGRAPHS = [
  [
    'Your ', KW.dashboard,
    ' is the first thing a business opens to check whether it got paid, and that’s the kind of product I want to build. I’m a final-year B.Tech CSE student applying for the Frontend Developer (fresher) role at Kestrel Pay.',
  ],
  [
    'During my two-month frontend internship at Juniper Health, I built the appointment booking screens in ', KW.typescript,
    ' on top of ', KW.rest, ' and wrote ', KW.tests,
    ' for each one. I also built CampusCart, a marketplace where students at my college buy and sell used books, using ', KW.react,
    ' and Node.js. So far, ', X, ' students have used it.',
  ],
  [
    'Working on FestHub, our college fest website, taught me to build ', KW.responsive,
    ' that holds up on budget phones and patchy campus Wi-Fi. It handled event registrations for ', X,
    ' students. On your team, I’d bring the same habits: fast pages, clear loading and error states, and tests for anything that touches money.',
  ],
  [
    'I’d welcome the chance to talk about how I can help with the dashboard. I’m happy to walk you through the CampusCart code or take on a short assignment, whichever is more useful for your team. Thank you for your time.',
  ],
]

const CONTACT = ['aditi.sharma@email.com', '+91 98XXX XX210', PERSONA.city]
const GREETING = `Dear ${PERSONA.recruiter.split(' ')[0]},`

const segText = (seg) => (typeof seg === 'string' ? seg : seg.placeholder ? '[X]' : seg.text)
const PARA_TEXT = PARAGRAPHS.map((segs) => segs.map(segText).join(''))
const WORD_COUNT = PARA_TEXT.join(' ').split(/\s+/).filter(Boolean).length

const paraId = (i) => `cover-letter-part-${i + 1}`
const formatDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

function letterText(date) {
  return [
    PERSONA.name, ...CONTACT, '',
    date, '',
    PERSONA.recruiter, PERSONA.recruiterTitle, '',
    GREETING, '',
    PARA_TEXT.join('\n\n'), '',
    'Sincerely,', PERSONA.name,
  ].join('\n')
}

async function copyToClipboard(text) {
  try {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Permission denied or no focus: try the older copy path below.
  }
  const previous = document.activeElement
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  Object.assign(area.style, { position: 'fixed', top: '0', left: '0', opacity: '0', pointerEvents: 'none' })
  document.body.appendChild(area)
  area.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  area.remove()
  if (previous instanceof HTMLElement) previous.focus({ preventScroll: true })
  return ok
}

async function saveLetterPdf(date) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 25
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const width = pageW - margin * 2
  const PT = 0.3528 // mm per point
  // The built-in Helvetica has no curly quotes, so use straight ones in the file.
  const plain = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  let y = margin

  const write = (text, { size = 11, bold = false, color = [59, 64, 61], gap = 0 } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lineH = size * PT * 1.5
    for (const line of doc.splitTextToSize(plain(text), width)) {
      if (y + lineH > pageH - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y, { baseline: 'top' })
      y += lineH
    }
    y += gap
  }

  write(PERSONA.name, { size: 13, bold: true, color: [13, 15, 14], gap: 1 })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100, 106, 102)
  let x = margin
  for (const item of CONTACT) {
    doc.text(item, x, y, { baseline: 'top' })
    x += doc.getTextWidth(item) + 6
  }
  y += 10 * PT * 1.5 + 4
  doc.setDrawColor(227, 230, 225)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  write(date, { gap: 5 })
  write(PERSONA.recruiter)
  write(PERSONA.recruiterTitle, { gap: 5 })
  write(GREETING, { gap: 3 })
  PARA_TEXT.forEach((p) => write(p, { gap: 3 }))
  write('Sincerely,')
  write(PERSONA.name, { color: [13, 15, 14] })

  doc.save('sample-cover-letter.pdf')
}

function isFocusVisible(el) {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

const KEYWORD_CLASS =
  'cursor-default rounded-[4px] bg-[#FFF1BF] bg-[linear-gradient(#F2B705,#F2B705)] bg-[length:100%_2px] bg-bottom bg-no-repeat px-[2px] text-inherit outline-none transition-colors duration-150 [-webkit-box-decoration-break:clone] [box-decoration-break:clone] hover:bg-[#FFE48A] focus-visible:bg-[#FFE48A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D0F0E] data-[popup-open]:bg-[#FFE48A]'

function Keyword({ kw, font }) {
  return (
    <Tooltip>
      <TooltipTrigger delay={120} render={<mark tabIndex={0} className={KEYWORD_CLASS} />}>
        {kw.text}
      </TooltipTrigger>
      <TooltipContent
        sideOffset={6}
        className="max-w-[260px] flex-col items-start gap-0.5 rounded-[10px] px-3 py-2 text-left shadow-[0_10px_28px_-10px_rgba(13,15,14,0.45)]"
        // The tooltip portals to <body>, outside the landing theme, so pin its colours and font here.
        style={{ '--foreground': INK, '--background': '#FFFFFF', fontFamily: font }}
      >
        <span className="text-[12px] font-medium leading-4 text-white/60">From the job post</span>
        <span className="text-[13px] leading-[1.4] text-white">“{kw.quote}”</span>
      </TooltipContent>
    </Tooltip>
  )
}

function Segment({ seg, font }) {
  if (typeof seg === 'string') return seg
  if (seg.placeholder) {
    return (
      <span className="whitespace-nowrap rounded-[4px] px-1 py-px font-medium" style={{ background: '#EDEFEA', color: INK }}>
        [X]
      </span>
    )
  }
  return <Keyword kw={seg} font={font} />
}

// Letter rows share one left gutter, which holds the paragraph markers.
const ROW = 'pl-8 pr-3 sm:pl-11 sm:pr-4'
const PARA_ON = '#FFF8DF'
const DIMMED = 0.3

export default function CoverLetterSection() {
  const sectionRef = useRef(null)
  const articleRef = useRef(null)
  const listRef = useRef(null)
  const itemRefs = useRef([])
  const paraRefs = useRef([])
  const activeRef = useRef(null)
  const copyTimer = useRef(null)
  const pdfTimer = useRef(null)
  const pdfBusyRef = useRef(false)

  const [revealRef, inView] = useInView({ threshold: 0.12 })
  const [today, setToday] = useState('')
  const [tooltipFont, setTooltipFont] = useState()

  // hover: { index, from: 'panel' | 'letter' }. Focus and pinned (tap/click) only come from the panel.
  const [hover, setHover] = useState(null)
  const [focusIndex, setFocusIndex] = useState(null)
  const [pinned, setPinned] = useState(null)
  const active = hover?.index ?? focusIndex ?? pinned
  const spotlight = active != null && hover?.from !== 'letter'

  const [glide, setGlide] = useState({ x: 0, y: 0, w: 0, h: 0, shown: false, animate: false })

  const [copyState, setCopyState] = useState('idle')
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfFailed, setPdfFailed] = useState(false)
  const [announce, setAnnounce] = useState('')

  useEffect(() => {
    setToday(formatDate(new Date()))
    if (sectionRef.current) setTooltipFont(getComputedStyle(sectionRef.current).fontFamily)
    return () => {
      clearTimeout(copyTimer.current)
      clearTimeout(pdfTimer.current)
    }
  }, [])

  // One highlight that glides between parts instead of each row fading on its own.
  const measure = useCallback((index, animate) => {
    const el = itemRefs.current[index]
    if (!el) return
    setGlide((g) => ({
      x: el.offsetLeft,
      y: el.offsetTop,
      w: el.offsetWidth,
      h: el.offsetHeight,
      shown: true,
      animate: animate && g.shown,
    }))
  }, [])

  useIsoLayoutEffect(() => {
    activeRef.current = active
    if (active == null) setGlide((g) => (g.shown ? { ...g, shown: false, animate: false } : g))
    else measure(active, true)
  }, [active, measure])

  useEffect(() => {
    const list = listRef.current
    if (!list || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      if (activeRef.current != null) measure(activeRef.current, false)
    })
    ro.observe(list)
    return () => ro.disconnect()
  }, [measure])

  const pickPart = (i) => {
    const next = pinned === i ? null : i
    setPinned(next)
    if (next == null) return
    // On phones the list sits above the letter, so bring the paragraph into view.
    const para = paraRefs.current[i]
    if (!para) return
    const r = para.getBoundingClientRect()
    if (r.top < 96 || r.bottom > window.innerHeight - 16) {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      para.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
    }
  }

  const handleCopy = async () => {
    const ok = await copyToClipboard(letterText(formatDate(new Date())))
    if (ok) {
      setCopyState('copied')
      setAnnounce('Letter copied to your clipboard.')
    } else {
      setCopyState('failed')
      setAnnounce('Couldn’t copy automatically. The letter is selected so you can copy it yourself.')
      const sel = window.getSelection?.()
      if (sel && articleRef.current) sel.selectAllChildren(articleRef.current)
    }
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopyState('idle'), 2000)
  }

  const handleDownload = async () => {
    if (pdfBusyRef.current) return
    pdfBusyRef.current = true
    setPdfBusy(true)
    setPdfFailed(false)
    clearTimeout(pdfTimer.current)
    try {
      await saveLetterPdf(formatDate(new Date()))
      setAnnounce('Sample cover letter downloaded as a PDF.')
    } catch {
      setPdfFailed(true)
      setAnnounce('Couldn’t create the PDF. Try again.')
      pdfTimer.current = setTimeout(() => setPdfFailed(false), 2500)
    } finally {
      pdfBusyRef.current = false
      setPdfBusy(false)
    }
  }

  const dim = cn('transition-opacity duration-200 ease-out', spotlight ? 'opacity-[0.3]' : 'opacity-100')
  const actionClass = 'h-10 w-full gap-2 px-4 text-[14px] min-[420px]:w-auto min-[420px]:min-w-[160px] lg:w-full'

  return (
    <section ref={sectionRef} id="tool-cover" data-tool="cover" className="scroll-mt-28">
      <SectionHeader
        tool="cover"
        title="A cover letter written for this job, not every job."
        description="Paste the job post and ResumeMax writes three or four tight paragraphs from your resume, in the company’s own words. It never makes up experience you don’t have."
      />

      <div
        ref={revealRef}
        className={cn(
          'mt-8 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none sm:mt-10',
          inView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        )}
      >
        <Stage tool="cover">
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_256px] lg:grid-rows-[auto_1fr] lg:gap-x-6 lg:gap-y-3">
            {/* Structure panel: above the letter on small screens, beside it on desktop. */}
            <Surface className="p-2 lg:col-start-2 lg:row-start-1">
              <div className="px-3 pb-2 pt-2">
                <h3 className="text-[15px] font-medium leading-5 tracking-[-0.01em]" style={{ color: INK }}>
                  Letter structure
                </h3>
                <p className="mt-0.5 text-[13px] tabular-nums" style={{ color: MUTED }}>
                  {PARTS.length} paragraphs, {WORD_COUNT} words
                </p>
              </div>

              <div className="relative">
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-0 top-0 rounded-[12px]"
                  style={{
                    background: T.tint,
                    transform: `translate3d(${glide.x}px, ${glide.y}px, 0)`,
                    width: glide.w,
                    height: glide.h,
                    opacity: glide.shown ? 1 : 0,
                    transitionProperty: glide.animate ? 'transform, width, height, opacity' : 'opacity',
                    transitionDuration: '240ms',
                    transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
                  }}
                />
                <ul
                  ref={listRef}
                  className="grid gap-0.5 sm:grid-cols-2 lg:grid-cols-1"
                  onPointerLeave={() => setHover((h) => (h?.from === 'panel' ? null : h))}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) setFocusIndex(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setPinned(null)
                  }}
                >
                  {PARTS.map((part, i) => {
                    const on = active === i
                    return (
                      <li key={part.label}>
                        <button
                          ref={(el) => {
                            itemRefs.current[i] = el
                          }}
                          type="button"
                          aria-pressed={pinned === i}
                          aria-controls={paraId(i)}
                          onPointerEnter={(e) => {
                            if (e.pointerType !== 'touch') setHover({ index: i, from: 'panel' })
                          }}
                          onFocus={(e) => setFocusIndex(isFocusVisible(e.currentTarget) ? i : null)}
                          onClick={() => pickPart(i)}
                          className="relative flex w-full items-start gap-3 rounded-[12px] px-3 py-2.5 text-left"
                        >
                          <span
                            aria-hidden
                            className="mt-px grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-medium tabular-nums transition-colors duration-200"
                            style={{ background: on ? T.strong : MIST, color: on ? INK : MUTED }}
                          >
                            {i + 1}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[14px] font-medium leading-5" style={{ color: INK }}>
                              {part.label}
                            </span>
                            <span className="mt-0.5 hidden text-[13px] leading-[1.45] sm:block" style={{ color: MUTED }}>
                              {part.desc}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div
                className="mx-3 mt-2 flex flex-wrap gap-x-5 gap-y-2 border-t pb-2 pt-3 text-[13px] leading-5"
                style={{ borderColor: LINE, color: MUTED }}
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-3.5 w-5 rounded-[3px] bg-[#FFF1BF] bg-[linear-gradient(#F2B705,#F2B705)] bg-[length:100%_2px] bg-bottom bg-no-repeat"
                  />
                  From the job post
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className="rounded-[4px] px-1 text-[12px] font-medium leading-[18px]"
                    style={{ background: '#EDEFEA', color: INK }}
                  >
                    [X]
                  </span>
                  Numbers you fill in
                </span>
              </div>
            </Surface>

            {/* The letter, laid out like the page you'd send. */}
            <Surface className="px-2 py-7 sm:px-4 sm:py-9 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:px-5 lg:py-10">
              <article
                ref={articleRef}
                aria-label="Sample cover letter for Kestrel Pay"
                className="text-[14px] leading-[1.7] sm:text-[15px]"
                style={{ color: TEXT }}
              >
                <div className={cn(ROW, dim)}>
                  <p className="text-[17px] font-medium leading-tight tracking-[-0.015em]" style={{ color: INK }}>
                    {PERSONA.name}
                  </p>
                  <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[13px] leading-5" style={{ color: MUTED }}>
                    {CONTACT.map((item) => (
                      <span key={item} className="whitespace-nowrap">
                        {item}
                      </span>
                    ))}
                  </p>
                  <div aria-hidden className="mt-5 h-px" style={{ background: LINE }} />
                  <p className="mt-5">{today || ' '}</p>
                  <p className="mt-4">
                    {PERSONA.recruiter}
                    <br />
                    {PERSONA.recruiterTitle}
                  </p>
                  <p className="mt-4">{GREETING}</p>
                </div>

                <div className="mt-2" onPointerLeave={() => setHover((h) => (h?.from === 'letter' ? null : h))}>
                  {PARAGRAPHS.map((segs, i) => {
                    const on = active === i
                    return (
                      <div
                        key={paraId(i)}
                        ref={(el) => {
                          paraRefs.current[i] = el
                        }}
                        id={paraId(i)}
                        onPointerEnter={(e) => {
                          if (e.pointerType !== 'touch') setHover({ index: i, from: 'letter' })
                        }}
                        className={cn('relative rounded-[12px] py-2 transition-[opacity,background-color] duration-200 ease-out', ROW)}
                        style={{ backgroundColor: on ? PARA_ON : 'transparent', opacity: spotlight && !on ? DIMMED : 1 }}
                      >
                        <span
                          aria-hidden
                          className="absolute left-[7px] top-[11px] grid size-[18px] place-items-center rounded-full text-[10.5px] font-medium leading-none tabular-nums transition-colors duration-200 sm:left-[13px] sm:top-[12px]"
                          style={{ background: on ? T.strong : MIST, color: on ? INK : MUTED }}
                        >
                          {i + 1}
                        </span>
                        <p>
                          {segs.map((seg, j) => (
                            <Segment key={j} seg={seg} font={tooltipFont} />
                          ))}
                        </p>
                      </div>
                    )
                  })}
                </div>

                <div className={cn(ROW, 'mt-3', dim)}>
                  <p>Sincerely,</p>
                  <p className="font-medium" style={{ color: INK }}>
                    {PERSONA.name}
                  </p>
                </div>
              </article>
            </Surface>

            <div className="flex flex-col gap-2 min-[420px]:flex-row lg:col-start-2 lg:row-start-2 lg:flex-col lg:self-start">
              <SecondaryButton onClick={handleCopy} className={actionClass}>
                {copyState === 'copied' ? <Check aria-hidden /> : <Copy aria-hidden />}
                {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy letter'}
              </SecondaryButton>
              <SecondaryButton onClick={handleDownload} aria-busy={pdfBusy} className={actionClass}>
                {pdfBusy ? <Spinner size={16} color="currentColor" track={null} /> : <Download aria-hidden />}
                {pdfBusy ? 'Creating PDF' : pdfFailed ? 'Try again' : 'Download PDF'}
              </SecondaryButton>
            </div>
          </div>
        </Stage>

        <p className="mt-4 text-[14px] leading-[1.5]" style={{ color: MUTED }}>
          Built from your resume and the job post. Copy it or download it as a PDF.
        </p>
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </div>
    </section>
  )
}
