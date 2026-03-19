import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ResumeLens — ATS Resume Analyzer',
  description:
    'Upload your resume and any job description. Get your ATS keyword score, missing skills, and AI-rewritten bullet points in seconds.',
  keywords: 'ATS resume checker, resume keywords, job application, resume analyzer',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
