'use client'

import { Children, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { INK, MUTED, TOOLS, JOURNEY, TOOL_ORDER, toolAnchor } from './tokens'

function useActiveTool() {
  const [active, setActive] = useState(TOOL_ORDER[0])
  useEffect(() => {
    const els = TOOL_ORDER.map((id) => document.getElementById(toolAnchor(id))).filter(Boolean)
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        const hits = entries.filter((e) => e.isIntersecting)
        if (!hits.length) return
        hits.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        setActive(hits[0].target.dataset.tool)
      },
      // A thin band ~40% down the viewport decides which tool you're reading.
      { rootMargin: '-38% 0px -58% 0px', threshold: 0 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return active
}

function ProMark() {
  return (
    <span className="rounded-full border border-[#D5D9D3] bg-white px-1.5 text-[10.5px] font-medium leading-[16px]" style={{ color: '#3B403D' }}>
      Pro
    </span>
  )
}

function SideRail({ active }) {
  return (
    <nav aria-label="Tools" className="hidden lg:block">
      <div className="sticky top-28">
        <ol className="relative space-y-7 border-l border-[#E3E6E1] pl-5">
          {JOURNEY.map((group) => {
            const groupActive = group.tools.includes(active)
            return (
              <li key={group.stage} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[25px] top-[5px] size-[9px] rounded-full border-2 border-white transition-colors"
                  style={{ background: groupActive ? INK : '#C8CEC7' }}
                />
                <p className="text-[13px] font-medium" style={{ color: groupActive ? INK : MUTED }}>{group.stage}</p>
                <ul className="mt-2 space-y-1">
                  {group.tools.map((id) => {
                    const t = TOOLS[id]
                    const on = active === id
                    return (
                      <li key={id}>
                        <a
                          href={`#${toolAnchor(id)}`}
                          aria-current={on ? 'true' : undefined}
                          className={cn(
                            '-ml-2.5 flex items-center gap-2 rounded-full px-2.5 py-1.5 text-[14.5px] font-medium transition-colors',
                            !on && 'text-[#646A66] hover:bg-[#F4F6F2] hover:text-[#0D0F0E]'
                          )}
                          style={on ? { background: t.tint, color: t.deep } : undefined}
                        >
                          <span aria-hidden className="size-2 rounded-full" style={{ background: t.strong }} />
                          {t.name}
                          {t.pro && <ProMark />}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}

function MobileBar({ active }) {
  const listRef = useRef(null)
  const itemRefs = useRef({})

  useEffect(() => {
    const list = listRef.current
    const item = itemRefs.current[active]
    if (!list || !item || list.scrollWidth <= list.clientWidth) return
    list.scrollTo({ left: item.offsetLeft - list.clientWidth / 2 + item.clientWidth / 2, behavior: 'smooth' })
  }, [active])

  return (
    <div className="sticky top-16 z-30 -mx-5 border-b border-[#E3E6E1] bg-white/95 px-5 py-2.5 backdrop-blur-md sm:-mx-8 sm:px-8 lg:hidden">
      <ul ref={listRef} aria-label="Tools" className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TOOL_ORDER.map((id) => {
          const t = TOOLS[id]
          const on = active === id
          return (
            <li key={id} ref={(el) => { itemRefs.current[id] = el }} className="shrink-0">
              <a
                href={`#${toolAnchor(id)}`}
                aria-current={on ? 'true' : undefined}
                className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13.5px] font-medium transition-colors"
                style={on ? { background: t.tint, color: t.deep, borderColor: 'transparent' } : { color: MUTED, borderColor: '#E3E6E1' }}
              >
                <span aria-hidden className="size-2 rounded-full" style={{ background: t.strong }} />
                {t.name}
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function ToolsJourney({ children }) {
  const active = useActiveTool()

  return (
    <section id="tools" aria-labelledby="tools-title" className="scroll-mt-16 pt-20 lg:pt-28">
      <div className="max-w-[760px]">
        <h2
          id="tools-title"
          className="font-medium"
          style={{ color: INK, fontSize: 'clamp(34px, 4.8vw, 58px)', lineHeight: 1.02, letterSpacing: '-0.045em' }}
        >
          One resume, one job post, everything you need to get hired.
        </h2>
        <p className="mt-5 max-w-[38rem] text-[18px] leading-[1.6]" style={{ color: MUTED }}>
          Start with a free check. When you&apos;re ready to apply, the Pro tools reuse the same resume and job post to
          write your cover letter and outreach, prep your interview and review your GitHub. Try each one twice for free.
        </p>
      </div>

      <div className="mt-10 lg:mt-16">
        <MobileBar active={active} />
        <div className="grid gap-x-14 lg:grid-cols-[220px_minmax(0,1fr)]">
          <SideRail active={active} />
          <div className="min-w-0 divide-y divide-[#E3E6E1]">
            {Children.map(children, (child) => (
              <div className="py-16 first:pt-10 last:pb-0 lg:py-24 lg:first:pt-0">{child}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
