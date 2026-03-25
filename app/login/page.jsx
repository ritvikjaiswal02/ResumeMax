'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import './login.css'

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithEmail } = useAuth()
  const router = useRouter()
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (user) router.replace('/analyze')
  }, [user, router])

  const handleMagicLink = async () => {
    if (!email.trim()) return
    setSending(true)
    await signInWithEmail(email.trim())
    setSent(true)
    setSending(false)
  }

  return (
    <div className="login-root" style={{
      minHeight: '100vh', display: 'flex', background: '#0a0a10',
    }}>

      {/* ═══ LEFT — Centered Glass Modal ═══ */}
      <div className="login-form-side" style={{
        flex: '0 0 48%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
        background: '#0e0e16',
      }}>

        {/* Subtle radial glow behind the card */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(233,185,76,0.04) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* Navbar inside left panel */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '20px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 10,
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', color: '#f0f0f4' }}>Resume<span style={{ color: '#e9b94c' }}>Lens</span></span>
          </Link>
          <Link href="/pricing" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Pricing</Link>
        </div>

        {/* ── Glass Card ── */}
        <div style={{
          width: '100%', maxWidth: 380,
          padding: '36px 32px',
          borderRadius: 20,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          zIndex: 5,
        }}>

          {/* Eye/Lens icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(233,185,76,0.15), rgba(233,185,76,0.05))',
            border: '1px solid rgba(233,185,76,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e9b94c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em',
            color: '#f0f0f4', margin: '0 0 4px', textAlign: 'center',
          }}>
            Welcome Back
          </h1>
          <p style={{
            fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: '0 0 28px',
            textAlign: 'center',
          }}>
            Continue your career journey with the precision of AI scanning.
          </p>

          {/* Google button */}
          <button
            className="login-google"
            onClick={signInWithGoogle}
            style={{
              width: '100%', height: 44, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)', color: '#f0f0f4',
              transition: 'background 0.15s',
              fontFamily: 'inherit', marginBottom: 10,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* OR divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', fontWeight: 700, letterSpacing: '0.1em' }}>OR EMAIL</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Email field */}
          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: 'block', fontSize: 10, fontWeight: 700,
              color: 'rgba(255,255,255,0.3)', marginBottom: 6,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              Email address
            </label>
            {sent ? (
              <div style={{
                padding: '12px 14px', borderRadius: 10,
                background: 'rgba(52,211,153,0.06)',
                border: '1px solid rgba(52,211,153,0.2)',
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#34d399', margin: 0 }}>
                  Check your inbox
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '3px 0 0' }}>
                  Magic link sent to <strong style={{ color: '#e9b94c' }}>{email}</strong>
                </p>
              </div>
            ) : (
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                className="login-input"
                style={{
                  width: '100%', height: 42, padding: '0 14px',
                  borderRadius: 10, fontSize: 13, color: '#f0f0f4',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxSizing: 'border-box', outline: 'none',
                  transition: 'border-color 0.15s',
                  fontFamily: 'inherit',
                }}
              />
            )}
          </div>

          {/* Send magic link / LOG IN button */}
          {!sent && (
            <button
              className="login-cta"
              onClick={handleMagicLink}
              disabled={sending || !email.trim()}
              style={{
                width: '100%', height: 44, borderRadius: 10,
                fontSize: 13, fontWeight: 800, cursor: 'pointer',
                background: '#e9b94c', color: '#0a0a10',
                border: 'none', marginTop: 4,
                letterSpacing: '0.04em',
                opacity: sending || !email.trim() ? 0.35 : 1,
                transition: 'opacity 0.15s, transform 0.1s',
                fontFamily: 'inherit',
              }}
            >
              {sending ? 'SENDING…' : 'LOG IN'}
            </button>
          )}

          {/* Bottom link */}
          <p style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
            <Link href="/" className="login-link" style={{
              color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.15s',
              fontSize: 11, letterSpacing: '0.04em',
            }}>
              ← BACK TO HOMEPAGE
            </Link>
          </p>
        </div>
      </div>

      {/* ═══ RIGHT — Hero Image ═══ */}
      <div className="login-left" style={{
        flex: 1, position: 'relative', overflow: 'hidden',
      }}>
        <img
          src="/login-hero.png"
          alt=""
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
          }}
        />
      </div>
    </div>
  )
}
