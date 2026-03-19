import Link from 'next/link'
import { redirect } from 'next/navigation'

/* ─── Landing Page (Server Component — SSR, fully crawlable) ─── */

export default function LandingPage({ searchParams }) {
  // Supabase redirects OAuth errors to the Site URL (/). Catch them here.
  if (searchParams?.error_code) {
    redirect(`/analyze?auth_error=true`)
  }
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Navbar ── */}
      <header className="bg-gray-950 text-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight text-white">
            Resume<span className="text-indigo-400">Lens</span>
          </span>
          <nav className="flex items-center gap-3">
            <Link
              href="/analyze"
              className="text-sm text-gray-300 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/analyze"
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white
                         px-4 py-2 rounded-lg transition-colors"
            >
              Get Started Free
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gray-950 text-white pt-20 pb-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest
                           text-indigo-400 border border-indigo-500/40 bg-indigo-500/10
                           px-3 py-1 rounded-full mb-6">
            Free ATS Resume Analyzer
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Know exactly why you&apos;re not
            <span className="text-indigo-400"> getting callbacks</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Paste any job description. Upload your resume. Get your ATS score, missing keywords,
            and AI-rewritten bullet points in under 30 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/analyze"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                         bg-indigo-600 hover:bg-indigo-500 text-white font-semibold
                         text-base px-8 py-3.5 rounded-xl transition-colors shadow-lg
                         shadow-indigo-900/40"
            >
              Analyze My Resume Free →
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center
                         text-gray-300 hover:text-white font-medium text-base px-6 py-3.5
                         rounded-xl border border-gray-700 hover:border-gray-500 transition-colors"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* ── Subtle divider ── */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-500">Three steps. Under a minute.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload your resume PDF',
                desc: 'Drop your resume PDF. Works with any PDF type — including Canva and design-tool exports.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 3v5a1 1 0 001 1h5" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Paste the job description',
                desc: 'Copy the full job description from LinkedIn, Indeed, or anywhere. Paste it in.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Get your score, gaps & rewrites',
                desc: 'See your ATS score, every missing keyword, and AI-rewritten bullets that use the job\'s own language.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
              },
            ].map(({ step, title, desc, icon }) => (
              <div key={step} className="relative bg-white rounded-2xl p-7 border border-gray-200 shadow-sm">
                <div className="absolute -top-3 -left-2 text-5xl font-black text-gray-100 select-none leading-none">
                  {step}
                </div>
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center
                                justify-center mb-4 relative z-10">
                  {icon}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything you need to beat the ATS</h2>
            <p className="text-gray-500">No guessing. No generic advice. Specific to your resume and this job.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                color: 'bg-indigo-50 text-indigo-600',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" />
                  </svg>
                ),
                title: 'ATS Keyword Score',
                desc: 'See exactly how your resume scores against the job\'s ATS filter. A number from 0–100 based on real keyword overlap.',
              },
              {
                color: 'bg-red-50 text-red-600',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                ),
                title: 'Gap Analysis',
                desc: 'Know which keywords are missing from your resume and exactly why they matter for this specific role.',
              },
              {
                color: 'bg-green-50 text-green-600',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ),
                title: 'AI Bullet Rewrites',
                desc: 'Get specific rewrites of your weakest bullets using the job\'s own language. Copy and paste directly into your resume.',
              },
            ].map(({ color, icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-gray-200 p-7 hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-5`}>
                  {icon}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="py-20 px-4 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-3xl font-bold text-white mb-3">
            Join 500+ job seekers getting more callbacks
          </p>
          <p className="text-indigo-200 mb-8">
            Free to start. No credit card. 2 analyses per month on the free plan.
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold
                       px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Analyze My Resume Free →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-500 py-8 px-4 text-center text-sm">
        ResumeLens © 2026 · Built for job seekers
      </footer>

    </div>
  )
}
