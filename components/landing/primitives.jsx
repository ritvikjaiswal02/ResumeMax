'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { INK, MUTED, TOOLS, toolAnchor } from './tokens'

export function useInView({ threshold = 0.3, once = true } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        if (once) io.disconnect()
      } else if (!once) {
        setInView(false)
      }
    }, { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, once])
  return [ref, inView]
}

// Hydration-safe: false on the server and first client render, then the real preference.
export function useReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduce(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduce
}

export function ProBadge({ className }) {
  return (
    <Badge
      variant="outline"
      className={cn('h-5 rounded-full border-[#D5D9D3] bg-white px-2 text-[11px] font-medium text-[#3B403D]', className)}
    >
      Pro
    </Badge>
  )
}

export function ToolTag({ tool, className }) {
  const t = TOOLS[tool]
  return (
    <span className={cn('inline-flex items-center gap-2 text-[14px] font-medium', className)} style={{ color: t.deep }}>
      <span aria-hidden className="size-2.5 rounded-full" style={{ background: t.strong }} />
      {t.name}
      {t.pro && <ProBadge />}
    </span>
  )
}

// Every tool section opens with this, so the tool name + colour always tells you where you are.
export function SectionHeader({ tool, title, description, className, children }) {
  return (
    <div className={cn('max-w-[640px]', className)}>
      <ToolTag tool={tool} />
      <h2
        className="mt-4 font-medium"
        style={{ color: INK, fontSize: 'clamp(30px, 4vw, 44px)', lineHeight: 1.06, letterSpacing: '-0.035em' }}
      >
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-[17px] leading-[1.6]" style={{ color: MUTED }}>
          {description}
        </p>
      )}
      {children}
    </div>
  )
}

// Pastel colour block that product mocks sit on. Largest radius in the system.
export function Stage({ tool, className, children, ...props }) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-[28px] p-4 sm:p-6 lg:p-8', className)}
      style={{ background: TOOLS[tool].tint }}
      {...props}
    >
      {children}
    </div>
  )
}

// A white product surface floating on a Stage. Mid radius.
export function Surface({ className, children, ...props }) {
  return (
    <div
      className={cn('relative rounded-[18px] bg-white', className)}
      style={{
        boxShadow: '0 0 0 1px rgba(13,15,14,0.06), 0 1px 2px rgba(13,15,14,0.05), 0 16px 36px -14px rgba(13,15,14,0.22)',
      }}
      {...props}
    >
      {children}
    </div>
  )
}

const primaryClasses =
  'h-11 rounded-full border-transparent bg-[#0D0F0E] px-5 text-[15px] font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_6px_16px_-6px_rgba(13,15,14,0.5)] hover:bg-[#262A28] focus-visible:ring-2 focus-visible:ring-[#0D0F0E] focus-visible:ring-offset-2'
const secondaryClasses =
  'h-11 rounded-full border border-[#D5D9D3] bg-white px-5 text-[15px] font-medium text-[#0D0F0E] hover:bg-[#F4F6F2] focus-visible:ring-2 focus-visible:ring-[#0D0F0E] focus-visible:ring-offset-2'

export function PrimaryButton({ href, className, children, ...props }) {
  if (href) {
    return (
      <Button asChild className={cn(primaryClasses, className)} {...props}>
        <Link href={href}>{children}</Link>
      </Button>
    )
  }
  return <Button className={cn(primaryClasses, className)} {...props}>{children}</Button>
}

export function SecondaryButton({ href, className, children, ...props }) {
  if (href) {
    return (
      <Button asChild variant="outline" className={cn(secondaryClasses, className)} {...props}>
        <Link href={href}>{children}</Link>
      </Button>
    )
  }
  return <Button variant="outline" className={cn(secondaryClasses, className)} {...props}>{children}</Button>
}

export { toolAnchor }
