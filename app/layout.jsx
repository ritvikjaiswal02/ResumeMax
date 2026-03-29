import { Fraunces, DM_Sans } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Script from 'next/script'

const GA_ID = 'G-DQ2KRHFYR8'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '600', '700', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

export const metadata = {
  title: 'ResumeMax — ATS Resume Analyzer',
  description:
    'Upload your resume and any job description. Get your ATS keyword score, missing keywords, and AI-rewritten bullet points in seconds. 5 free analyses every month.',
  keywords: 'ATS resume checker, resume analyzer, resume keywords, job application, ATS score, cover letter generator, interview prep',
  metadataBase: new URL('https://resumemax.in'),
  openGraph: {
    title: 'ResumeMax — Stop Getting Ghosted by ATS Filters',
    description: 'Get your ATS score, missing keywords & AI bullet rewrites in 30 seconds. 5 free analyses/month — no card needed.',
    url: 'https://resumemax.in',
    siteName: 'ResumeMax',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ResumeMax — ATS Resume Analyzer',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResumeMax — Stop Getting Ghosted by ATS Filters',
    description: 'Get your ATS score, missing keywords & AI bullet rewrites in 30 seconds. 5 free analyses/month.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={cn(fraunces.variable, dmSans.variable)}>
      <head>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
