import { Onest } from 'next/font/google'
import './landing.css'

const onest = Onest({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-onest',
  display: 'swap',
})

// Wraps a route in the new light theme + Onest. Use from a route's layout.jsx.
export default function AppShell({ children }) {
  return <div className={onest.variable}>{children}</div>
}
