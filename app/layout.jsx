import { Fraunces, DM_Sans } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'

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
        url: '/login-hero.png',
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
    images: ['/login-hero.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={cn(fraunces.variable, dmSans.variable)}>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
