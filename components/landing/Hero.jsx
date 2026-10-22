'use client'

import { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PrimaryButton, SecondaryButton, Stage } from './primitives'
import { INK, MUTED, TEXT, TOOLS, TOOL_ORDER, toolAnchor } from './tokens'

import { Spinner } from './Loader'

const ResumeScene = dynamic(() => import('@/components/three/ResumeScene'), {
  ssr: false,
  // Shown while three.js downloads, so the stage never sits empty.
  loading: () => (
    <div className="absolute inset-0 grid place-items-center" role="status" aria-label="Loading the interactive resume">
      <div className="rmx-shimmer h-[62%] w-[52%] max-w-[340px] rounded-[18px] bg-white/70" style={{ boxShadow: '0 0 0 1px rgba(13,15,14,0.06), 0 24px 48px -20px rgba(13,15,14,0.25)' }}>
        <div className="flex h-full flex-col gap-3 p-6">
          <span className="h-4 w-1/2 rounded-full bg-[#E3E6E1]" />
          <span className="h-2.5 w-1/3 rounded-full bg-[#EEF0EC]" />
          <span className="mt-4 h-2.5 w-full rounded-full bg-[#EEF0EC]" />
          <span className="h-2.5 w-11/12 rounded-full bg-[#EEF0EC]" />
          <span className="h-2.5 w-4/5 rounded-full bg-[#EEF0EC]" />
          <span className="mt-auto self-center"><Spinner size={22} color="#12B76A" track="#D9F6E6" /></span>
        </div>
      </div>
    </div>
  ),
})

export default function Hero() {
  const sceneRef = useRef(null)
  const [score, setScore] = useState(42)
  const [meta, setMeta] = useState({ docked: 0, total: 6, rewritten: false, scanning: false })
  const onScore = (s, m) => { setScore(s); setMeta(m) }
  const done = meta.docked === meta.total && meta.rewritten
  const touched = meta.docked > 0 || meta.rewritten

  const hint = meta.scanning
    ? 'Reading every line the way an ATS would.'
    : done
      ? `Score went from 42 to ${score}. That's a resume worth sending.`
      : touched
        ? `${meta.docked} of ${meta.total} missing keywords added. Score is ${score}.`
        : 'Tap a red keyword to add it to the resume.'

  return (
    <section aria-labelledby="hero-title">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:items-center lg:gap-14 lg:pb-24 lg:pt-12">
        <div>
          <h1
            id="hero-title"
            className="font-medium"
            style={{ color: INK, fontSize: 'clamp(46px, 6.6vw, 88px)', lineHeight: 0.98, letterSpacing: '-0.05em', textWrap: 'balance' }}
          >
            Land the interview. Then ace it.
          </h1>

          <p className="mt-6 max-w-[34rem] text-[18px] leading-[1.6]" style={{ color: MUTED }}>
            Check your resume against the job post, then write the cover letter, message the recruiter, practise the
            questions you&apos;ll get and fix your GitHub. One place for the whole placement season.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <PrimaryButton href="/analyze">Check my resume free</PrimaryButton>
            <SecondaryButton href="#tools">See every tool</SecondaryButton>
          </div>
          <p className="mt-4 text-[14px]" style={{ color: MUTED }}>
            5 free checks every month. No card needed.
          </p>

          <ul aria-label="Tools in ResumeMax" className="mt-10 flex flex-wrap gap-2">
            {TOOL_ORDER.map((id) => {
              const t = TOOLS[id]
              return (
                <li key={id}>
                  <a
                    href={`#${toolAnchor(id)}`}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13.5px] font-medium transition-transform duration-150 hover:-translate-y-px"
                    style={{ background: t.tint, color: t.deep }}
                  >
                    <span aria-hidden className="size-2 rounded-full" style={{ background: t.strong }} />
                    {t.name}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>

        <Stage tool="resume" className="p-0 sm:p-0 lg:p-0">
          <div className="relative h-[440px] sm:h-[540px] lg:h-[620px]">
            <ResumeScene controls={sceneRef} onScore={onScore} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-4 sm:p-5">
              <p
                aria-live="polite"
                className="pointer-events-auto max-w-[300px] rounded-[12px] bg-white/90 px-3.5 py-2.5 text-[13.5px] leading-snug"
                style={{ color: TEXT, boxShadow: '0 0 0 1px rgba(13,15,14,0.06)' }}
              >
                {hint}
              </p>
              <div className="pointer-events-auto flex gap-2">
                {touched && (
                  <Button
                    onClick={() => sceneRef.current?.reset()}
                    className="h-9 rounded-full border border-[#D5D9D3] bg-white px-3.5 text-[13.5px] font-medium text-[#0D0F0E] hover:bg-[#F4F6F2]"
                  >
                    <RotateCcw aria-hidden />
                    Start over
                  </Button>
                )}
                {!done && (
                  <Button
                    onClick={() => sceneRef.current?.optimize()}
                    disabled={meta.scanning}
                    className="h-9 rounded-full bg-[#0D0F0E] px-3.5 text-[13.5px] font-medium text-white hover:bg-[#262A28]"
                  >
                    <Play aria-hidden className="fill-current" />
                    {meta.scanning ? 'Checking' : 'Run a sample check'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Stage>
      </div>
    </section>
  )
}
