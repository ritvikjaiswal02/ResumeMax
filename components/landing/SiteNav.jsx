'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { PrimaryButton } from './primitives'
import { INK } from './tokens'

export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('size-6', className)}>
      <rect x="1" y="1" width="22" height="22" rx="7" fill={INK} />
      <path d="M7.2 12.4l3.1 3.1 6.5-7" fill="none" stroke="#5EE6A4" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const LINKS = [
  { href: '#tools', label: 'Tools' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-colors duration-200',
        scrolled ? 'border-[#E3E6E1] bg-white/90 backdrop-blur-md' : 'border-transparent bg-white'
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-3 px-5 sm:gap-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="ResumeMax home">
          <LogoMark />
          <span className="text-[17px] font-semibold tracking-[-0.02em]" style={{ color: INK }}>ResumeMax</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-[14.5px] font-medium text-[#646A66] transition-colors hover:bg-[#F1F3EF] hover:text-[#0D0F0E]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/login"
            className="whitespace-nowrap rounded-full px-2.5 py-2 text-[14.5px] font-medium text-[#646A66] transition-colors hover:text-[#0D0F0E] sm:px-3"
          >
            Sign in
          </Link>
          <PrimaryButton href="/analyze" className="h-9 px-4 text-[14px]">
            Start free
          </PrimaryButton>
        </div>
      </div>
    </header>
  )
}
