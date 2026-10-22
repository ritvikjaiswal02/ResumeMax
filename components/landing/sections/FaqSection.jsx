'use client'

import Link from 'next/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { INK, LINE, MIST, MUTED, TEXT } from '@/components/landing/tokens'

const headingStyle = {
  color: INK,
  fontSize: 'clamp(32px, 4.4vw, 52px)',
  lineHeight: 1.04,
  letterSpacing: '-0.035em',
  textWrap: 'balance',
}

const SCORE_PARTS = [
  ['Keyword coverage', 40],
  ['How well your experience fits the role', 30],
  ['Skills alignment', 20],
  ['Resume quality, like quantified bullets and clear structure', 10],
]

const FAQS = [
  {
    id: 'free',
    question: 'Is ResumeMax free?',
    answer: (
      <p>
        Yes. You get 5 resume checks every month, each with the full result: your score, missing keywords, rewritten
        bullets and formatting checks. The count resets each month. You also get 2 free tries of every Pro tool:
        cover letters, cold outreach, interview prep and portfolio review. After that, they need a Pro Pass.
      </p>
    ),
  },
  {
    id: 'score',
    question: 'What does the ATS score actually measure?',
    answer: (
      <>
        <p>How well your resume matches one specific job post, out of 100. The score adds up four parts:</p>
        <ul className="mt-4 rounded-[14px] px-4 py-1 sm:px-5" style={{ background: MIST }}>
          {SCORE_PARTS.map(([label, points], i) => (
            <li
              key={label}
              className={`flex items-baseline justify-between gap-6 py-3 ${i > 0 ? 'border-t' : ''}`}
              style={{ borderColor: LINE, color: TEXT }}
            >
              <span>{label}</span>
              <span className="shrink-0 font-medium tabular-nums" style={{ color: INK }}>
                {points} points
              </span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: 'design-pdf',
    question: 'Will it read my Canva or Figma resume?',
    answer: (
      <p>
        Yes. ResumeMax reads the PDF itself, including text that design tools export as shapes, so PDFs from Canva,
        Figma, Word, Google Docs and Overleaf all work. Files can be up to 5&nbsp;MB.
      </p>
    ),
  },
  {
    id: 'no-made-up',
    question: 'Will the AI make things up on my resume?',
    answer: (
      <p>
        No. Rewrites only use what&apos;s already on your resume. If a number would make a bullet stronger but we
        don&apos;t know it, you&apos;ll see{' '}
        <code className="rounded-[6px] px-1.5 py-0.5 font-mono text-[0.9em]" style={{ background: MIST, color: INK }}>
          [X]
        </code>{' '}
        so you can fill in the real figure.
      </p>
    ),
  },
  {
    id: 'subscription',
    question: 'Is the Pro Pass a subscription?',
    answer: (
      <p>
        No. It&apos;s a one-time payment for 30, 90 or 180 days. It doesn&apos;t renew, and every pass unlocks the same
        tools.
      </p>
    ),
  },
  {
    id: 'history',
    question: 'Can I see my old checks?',
    answer: (
      <p>
        Yes. Every check is saved to your history with its score and job title. Open one to re-run it with an updated
        resume and see how much your score moved.
      </p>
    ),
  },
]

export default function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24">
      <div className="grid gap-8 sm:gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 id="faq-title" className="font-medium" style={headingStyle}>
            Questions students ask
          </h2>
          <p className="mt-5 max-w-[420px] text-[17px] leading-[1.6]" style={{ color: MUTED }}>
            Still unsure?{' '}
            <Link
              href="/analyze"
              className="font-medium underline decoration-[#C9CEC6] decoration-2 underline-offset-4 transition-colors hover:decoration-[#0D0F0E]"
              style={{ color: INK }}
            >
              Start with a free check
            </Link>{' '}
            and see what you get.
          </p>
        </div>

        <Accordion multiple defaultValue={['free']} className="border-t border-[#E3E6E1]">
          {FAQS.map(({ id, question, answer }) => (
            <AccordionItem key={id} value={id} className="border-[#E3E6E1] last:border-b">
              <AccordionTrigger className="gap-6 rounded-[6px] py-5 text-[17px] leading-[1.45] text-[#0D0F0E] focus-visible:ring-0 sm:py-6 [&>svg]:mt-[3px] [&>svg]:size-5 [&:hover>svg]:text-[#0D0F0E]">
                {question}
              </AccordionTrigger>
              <AccordionContent className="max-w-[62ch] pb-6 pr-8 text-[15px] leading-[1.65] text-[#646A66] sm:text-[16px]">
                {answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
