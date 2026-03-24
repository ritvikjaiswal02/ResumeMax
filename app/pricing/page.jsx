'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const PASSES = [
  {
    id: 'sprint',
    duration: '30 DAYS ACCESS',
    name: '1-Month Sprint',
    price: '₹149',
    highlight: false,
    features: [
      'Unlimited AI Bullet Rewrites',
      'PDF Cover Letter Generator',
      'Cold Outreach Generator',
      'Interview Prep (STAR Method)',
    ],
  },
  {
    id: 'season',
    duration: '90 DAYS ACCESS',
    name: 'Placement Season',
    price: '₹299',
    highlight: true,
    features: [
      'Everything in the ₹149 plan',
      '90 full days of access',
      'Best value for the placement rush',
    ],
  },
  {
    id: 'grind',
    duration: '180 DAYS ACCESS',
    name: 'Off-Campus Grind',
    price: '₹499',
    highlight: false,
    features: [
      'Everything in the ₹299 plan',
      '180 full days of access',
      'Perfect for off-campus hunting',
    ],
  },
]

export default function PricingPage() {
  const { user, session, loading } = useAuth()
  const router = useRouter()
  const [activeLoading, setActiveLoading] = useState(null)
  const [isPro, setIsPro]               = useState(false)
  const [successPlan, setSuccessPlan]   = useState(null)
  const [authToast, setAuthToast]       = useState(false)

  useEffect(() => {
    if (!session) return
    fetch('/api/usage', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(r => r.json())
      .then(d => { if (d.plan === 'pro') setIsPro(true) })
      .catch(() => {})
  }, [session])

  const handleBuy = async (planId) => {
    if (!session) {
      setAuthToast(true)
      setTimeout(() => {
        setAuthToast(false)
        router.push('/analyze')
      }, 2000)
      return
    }
    setActiveLoading(planId)
    try {
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan: planId }),
      })
      const order = await res.json()
      if (!res.ok) { setActiveLoading(null); return }
      const pass = PASSES.find(p => p.id === planId)
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount, currency: order.currency, order_id: order.order_id,
        name: 'ResumeLens AI', description: pass?.name || 'Pro Pass',
        prefill: { email: user?.email }, theme: { color: '#ffc174' },
        handler: async (response) => {
          try {
            const v  = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
              body: JSON.stringify(response),
            })
            const vd = await v.json()
            if (vd.success) { setIsPro(true); setSuccessPlan(planId) }
          } catch { /* silent */ }
          setActiveLoading(null)
        },
        modal: { ondismiss: () => setActiveLoading(null) },
      })
      rzp.open()
    } catch { setActiveLoading(null) }
  }

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen selection:bg-primary selection:text-on-primary">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* ── Auth toast ── */}
      {authToast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 20px', borderRadius: 12,
          background: 'rgba(25,31,49,0.97)', border: '1px solid rgba(255,193,116,0.35)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          fontSize: 14, fontWeight: 600, color: '#ffc174',
          animation: 'fadeIn 0.2s ease',
        }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#ffc174" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
          </svg>
          Sign in first — redirecting you now…
        </div>
      )}

      {/* ── Background blobs (exact match to reference) ── */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-tertiary-container/5 blur-[100px]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-surface-container-low">
        <Link href="/" className="font-headline text-xl font-bold tracking-tighter text-primary no-underline">
          ResumeLens AI
        </Link>
        <div className="hidden md:flex items-center gap-8 font-label text-sm">
          <Link href="/analyze"  className="text-on-surface-variant hover:text-on-surface transition-colors no-underline">Dashboard</Link>
          <Link href="/pricing"  className="text-primary border-b-2 border-primary pb-0.5 no-underline">Pricing</Link>
          <Link href="/analyze"  className="text-on-surface-variant hover:text-on-surface transition-colors no-underline">Analysis</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/analyze"
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-5 py-2 rounded-xl font-bold text-sm tracking-tight hover:opacity-90 transition-all duration-150 no-underline"
          >
            {user ? 'Dashboard →' : 'Upload Resume'}
          </Link>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto min-h-screen">

        {/* ── Hero ── */}
        <section className="text-center mb-20">
          <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface mb-6">
            Pick Your Plan
          </h1>
          <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Start free. Upgrade when you're ready. Empower your career with
            AI-driven resume tools built for job seekers.
          </p>
        </section>

        {/* ── Pricing Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center md:items-center">

          {PASSES.map((pass) => {
            const isActive  = isPro || successPlan === pass.id
            const isLoading = activeLoading === pass.id

            if (pass.highlight) {
              return (
                <div
                  key={pass.id}
                  className="relative glass-card rounded-2xl border-2 border-primary amber-glow flex flex-col md:scale-105 z-10 shadow-2xl overflow-hidden min-h-[680px]"
                >
                  {/* Top amber shimmer line */}
                  <div className="h-1 w-full bg-gradient-to-r from-primary/0 via-primary to-primary/0" />

                  <div className="px-10 pt-10 pb-10 flex flex-col flex-grow">
                    {/* Floating badge */}
                    <div className="self-start mb-5 bg-primary/15 border border-primary/30 text-primary text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase">
                      MOST POPULAR
                    </div>

                    <h3 className="font-headline text-3xl font-extrabold text-on-surface mb-1 tracking-tight">
                      {pass.name}
                    </h3>
                    <p className="text-on-surface-variant/60 text-sm mb-6">Full placement season coverage</p>

                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-headline text-6xl font-extrabold text-on-surface tracking-tighter leading-none">
                        {pass.price}
                      </span>
                    </div>
                    <p className="text-on-surface-variant text-sm mb-1">One-time payment</p>
                    <p className="text-primary text-xs font-black uppercase tracking-widest mb-8">
                      {pass.duration}
                    </p>

                    {/* Divider */}
                    <div className="h-px bg-primary/15 mb-8" />

                    <ul className="space-y-5 flex-grow mb-10">
                      {pass.features.map(f => (
                        <li key={f} className="flex items-center gap-4 text-[15px] text-on-surface">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary/15 border border-secondary/20 flex items-center justify-center">
                            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#4edea3" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    {isActive ? (
                      <div className="w-full py-5 rounded-xl bg-primary/10 border border-primary/25 text-primary font-bold text-center text-base">
                        ✓ Active
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBuy(pass.id)}
                        disabled={activeLoading !== null || loading}
                        className="w-full py-5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-black text-lg shadow-lg hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Opening payment…' : 'Get Started'}
                      </button>
                    )}
                  </div>
                </div>
              )
            }

            // Side cards
            return (
              <div
                key={pass.id}
                className="glass-card rounded-2xl border border-outline-variant/15 flex flex-col hover:border-outline-variant/35 transition-all duration-300 overflow-hidden min-h-[560px]"
              >
                <div className="px-9 pt-10 pb-10 flex flex-col flex-grow">
                  <h3 className="font-headline text-2xl font-bold text-on-surface mb-1 tracking-tight">
                    {pass.name}
                  </h3>
                  <p className="text-on-surface-variant/50 text-sm mb-6">
                    {pass.id === 'sprint' ? 'One focused month of job hunting' : 'Extended off-campus grind mode'}
                  </p>

                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-headline text-5xl font-extrabold text-on-surface tracking-tighter leading-none">
                      {pass.price}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-sm mb-1">One-time payment</p>
                  <p className="text-primary text-xs font-black uppercase tracking-widest mb-8">
                    {pass.duration}
                  </p>

                  {/* Divider */}
                  <div className="h-px bg-outline-variant/20 mb-8" />

                  <ul className="space-y-5 flex-grow mb-10">
                    {pass.features.map(f => (
                      <li key={f} className="flex items-center gap-4 text-[14px] text-on-surface-variant">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary/10 border border-secondary/15 flex items-center justify-center">
                          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#4edea3" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isActive ? (
                    <div className="w-full py-5 rounded-xl bg-primary/10 border border-primary/25 text-primary font-bold text-center text-base">
                      ✓ Active
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBuy(pass.id)}
                      disabled={activeLoading !== null || loading}
                      className="w-full py-5 rounded-xl border border-outline-variant/30 text-on-surface font-bold text-base hover:bg-surface-container transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Opening payment…' : 'Get Started'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Footnote ── */}
        <div className="mt-16 text-center">
          <p className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-surface-container-low border border-outline-variant/10 text-on-surface-variant text-sm font-medium">
            <span className="text-primary">★</span>
            1 free Pro use included — try before you pay
          </p>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full py-8 mt-auto border-t border-outline-variant/15 bg-surface">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto gap-4">
          <p className="font-body text-xs text-on-surface-variant">
            © 2026 ResumeLens AI · Digital Career Precision.
          </p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'API Docs', 'Contact Support'].map(l => (
              <a key={l} href="#" className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100">
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
