import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import RefTracker from '@/components/RefTracker'
import AppShell from '@/components/landing/AppShell'
import LandingPage from '@/components/landing/LandingPage'

export default function HomePage({ searchParams }) {
  if (searchParams?.error_code) {
    redirect(`/analyze?auth_error=true`)
  }

  return (
    <AppShell>
      <Suspense fallback={null}><RefTracker /></Suspense>
      <LandingPage />
    </AppShell>
  )
}
