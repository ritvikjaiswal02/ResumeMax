'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export default function HomeNavbar() {
  const { user, signOut } = useAuth()
  const [avatarOpen, setAvatarOpen] = useState(false)
  const avatarRef = useRef(null)

  useEffect(() => {
    if (!avatarOpen) return
    const handler = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [avatarOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-border/60"
      style={{ background: 'rgba(13,13,17,0.8)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-display text-xl font-bold tracking-tight">
          Resume<span style={{ color: 'var(--gold)' }}>Lens</span>
        </span>
        <nav className="flex items-center gap-3">
          <Link href="/pricing" className="text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--muted-foreground)' }}>
            Pricing
          </Link>

          {user ? (
            <>
              <Link href="/analyze"
                className="text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--muted-foreground)' }}>
                Dashboard
              </Link>
              <div ref={avatarRef} className="relative">
                <button
                  onClick={() => setAvatarOpen(o => !o)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all"
                  style={{ background: 'var(--gold)', color: '#0d0d11' }}>
                  {user.email?.[0]?.toUpperCase() ?? '?'}
                </button>
                {avatarOpen && (
                  <div className="absolute right-0 top-10 w-52 rounded-xl shadow-2xl z-50 overflow-hidden"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>{user.email}</p>
                    </div>
                    <Link href="/pricing"
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors hover:bg-white/5"
                      style={{ color: 'var(--muted-foreground)' }}>
                      Upgrade Plan
                    </Link>
                    <button
                      onClick={() => { setAvatarOpen(false); signOut() }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors hover:bg-white/5 text-left"
                      style={{ color: 'var(--danger)' }}>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild className="font-bold"
                style={{ background: 'var(--gold)', color: '#0d0d11' }}>
                <Link href="/login">Get Started Free</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
