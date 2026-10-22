'use client'

import { cn } from '@/lib/utils'
import { PrimaryButton, SecondaryButton, Stage, Surface, useInView } from '../primitives'
import { INK, LINE, MUTED, PERSONA, SUCCESS, TEXT } from '../tokens'

// Hand-drawn "Priya Nair" scribble: first name, surname, then a quick underline.
const SIGNATURE_PATH =
  'M8 46C8.8 43.3 11.3 35.3 13 30C14.7 24.7 16.5 17.8 18 14C19.5 10.2 20 8.5 22 7C24 5.5 27.5 4.7 30 5C32.5 5.3 35.8 7 37 9C38.2 11 38.2 14.7 37 17C35.8 19.3 32.8 21.7 30 23C27.2 24.3 20.7 24.3 20 25C19.3 25.7 24.2 26 26 27C27.8 28 29.7 31.2 31 31C32.3 30.8 32.8 26 34 26C35.2 26 36.8 29.8 38 31C39.2 32.2 40 33.7 41 33C42 32.3 43.2 27 44 27C44.8 27 45.2 32 46 33C46.8 34 48 34 49 33C50 32 51.2 27 52 27C52.8 27 53 32.2 54 33C55 33.8 57 33 58 32C59 31 59.8 26 60 27C60.2 28 59.8 34.2 59 38C58.2 41.8 56.5 47.3 55 50C53.5 52.7 51.2 54.2 50 54C48.8 53.8 47.3 50.8 48 49C48.7 47.2 51.5 45.2 54 43C56.5 40.8 60.3 38.2 63 36C65.7 33.8 69.5 31.2 70 30C70.5 28.8 67.2 28.5 66 29C64.8 29.5 62.8 32 63 33C63.2 34 65.5 35.5 67 35C68.5 34.5 70.8 30.2 72 30C73.2 29.8 72.7 33.5 74 34C75.3 34.5 79 33.2 80 33' +
  'M90 40C90.5 37.7 91.8 31 93 26C94.2 21 95.5 10.3 97 10C98.5 9.7 100.2 19.3 102 24C103.8 28.7 106.5 38 108 38C109.5 38 109.8 28.8 111 24C112.2 19.2 114.2 9.3 115 9C115.8 8.7 115.3 18.2 116 22C116.7 25.8 117.7 31 119 32C120.3 33 123.7 28.8 124 28C124.3 27.2 121.3 26.3 121 27C120.7 27.7 121 31.3 122 32C123 32.7 125.7 31.8 127 31C128.3 30.2 129.3 26.8 130 27C130.7 27.2 130.2 31.3 131 32C131.8 32.7 133.8 31.8 135 31C136.2 30.2 137 27.3 138 27C139 26.7 139.7 28.8 141 29C142.3 29.2 144.2 28.7 146 28C147.8 27.3 151 25.5 152 25' +
  'M18 50C25 49.3 44.7 47 60 46C75.3 45 93 45.5 110 44C127 42.5 153.3 38.2 162 37'

function Signature({ className }) {
  return (
    <svg viewBox="0 0 170 60" aria-hidden="true" focusable="false" className={className}>
      <path
        d={SIGNATURE_PATH}
        fill="none"
        stroke={INK}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Rubber stamp that lands once the letter scrolls into view. With reduced motion the
// motion-safe classes never apply, so it simply sits there in its final state.
function AcceptedStamp({ stamped }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute left-[40%] top-[-4px] inline-flex rotate-[-8deg] items-center gap-1.5 rounded-[10px] border-2 px-3 py-1.5 mix-blend-multiply',
        'motion-safe:transition-[transform,opacity] motion-safe:delay-200 motion-safe:duration-[360ms] motion-safe:ease-[cubic-bezier(0.3,1.5,0.55,1)]',
        stamped ? 'scale-100 opacity-100' : 'motion-safe:scale-[1.4] motion-safe:opacity-0'
      )}
      style={{
        color: SUCCESS,
        borderColor: SUCCESS,
        boxShadow: `inset 0 0 0 2px #ffffff, inset 0 0 0 3px ${SUCCESS}`,
      }}
    >
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 8.5l3 3 6-7" />
      </svg>
      <span className="text-[19px] font-semibold leading-none tracking-[-0.02em]">Accepted</span>
    </div>
  )
}

function OfferLetter() {
  const [ref, inView] = useInView({ threshold: 0.5 })

  return (
    <div ref={ref} className="mx-auto w-full max-w-[420px] lg:mx-0 lg:max-w-none">
      <Surface
        role="img"
        aria-label={`Sample offer letter from ${PERSONA.company} to ${PERSONA.firstName} for the Frontend Developer role in ${PERSONA.city}, stamped accepted`}
        className="rotate-[2deg] p-5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:p-8 [@media(hover:hover)_and_(pointer:fine)]:hover:rotate-0"
      >
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[17px] font-semibold tracking-[-0.03em]" style={{ color: INK }}>
            {PERSONA.company}
          </span>
          <span className="text-[13px]" style={{ color: MUTED }}>
            9 October 2026
          </span>
        </div>
        <div className="mt-4 h-px" style={{ background: LINE }} />

        <p className="mt-6 text-[15px] font-medium tracking-[-0.01em]" style={{ color: INK }}>
          Offer of employment
        </p>
        <div className="mt-4 space-y-3 text-[14.5px] leading-[1.65]" style={{ color: TEXT }}>
          <p>Dear {PERSONA.firstName},</p>
          <p>
            We&apos;re delighted to offer you the role of{' '}
            <span className="font-medium" style={{ color: INK }}>Frontend Developer</span> in our {PERSONA.city} team.
            Your joining date is 1 July 2027.
          </p>
          <p>We look forward to working with you.</p>
        </div>

        <div className="relative mt-7">
          <Signature className="h-10 w-auto sm:h-11" />
          <p className="mt-1 text-[14px] font-medium" style={{ color: INK }}>
            {PERSONA.recruiter}
          </p>
          <p className="text-[13px]" style={{ color: MUTED }}>
            {PERSONA.recruiterTitle}
          </p>
          <AcceptedStamp stamped={inView} />
        </div>
      </Surface>
    </div>
  )
}

export default function ClosingSection() {
  return (
    <section aria-labelledby="closing-title">
      <Stage tool="resume" className="px-6 py-12 sm:px-10 sm:py-14 lg:px-12 lg:py-16 xl:px-16 xl:py-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)] xl:gap-20">
          <div className="max-w-[580px]">
            <h2
              id="closing-title"
              className="text-balance font-medium"
              style={{ color: INK, fontSize: 'clamp(36px, 5.2vw, 64px)', lineHeight: 1.02, letterSpacing: '-0.04em' }}
            >
              The offer letter is the one thing we can&apos;t write for you.
            </h2>
            <p className="mt-6 max-w-[460px] text-pretty text-[17px] leading-[1.6]" style={{ color: TEXT }}>
              We can help with everything before it, from your first resume check to the final HR round.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <PrimaryButton href="/analyze">Check my resume free</PrimaryButton>
              <SecondaryButton href="#pricing">See Pro passes</SecondaryButton>
            </div>
            <p className="mt-4 text-[14px]" style={{ color: MUTED }}>
              5 free checks every month. No card needed.
            </p>
          </div>

          <OfferLetter />
        </div>
      </Stage>
    </section>
  )
}
