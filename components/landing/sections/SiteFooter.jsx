import Link from 'next/link'
import { LogoMark } from '../SiteNav'
import { INK, LINE, MUTED, TOOLS, TOOL_ORDER, toolAnchor } from '../tokens'

const ACCOUNT_LINKS = [
  { href: '/login', label: 'Sign in' },
  { href: '/history', label: 'History' },
  { href: '/pricing', label: 'Pricing' },
]

// MUTED at rest, INK on hover. Colours live in classes (not inline styles) so hover can win.
const LINK_CLASS =
  'inline-flex items-center gap-2.5 rounded-[4px] text-[15px] text-[#646A66] transition-colors duration-150 hover:text-[#0D0F0E]'

function LinkColumn({ id, title, children }) {
  return (
    <nav aria-labelledby={id}>
      <h2 id={id} className="text-[14px] font-medium" style={{ color: INK }}>
        {title}
      </h2>
      <ul className="mt-4 space-y-3">{children}</ul>
    </nav>
  )
}

// Oversized wordmark that closes the page. The viewBox cuts through the letters, so the
// word is cropped at the footer's bottom edge and scales with the container at any width.
function GiantWordmark() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 12 1000 100"
      className="pointer-events-none mt-10 block h-auto w-full select-none sm:mt-14"
      style={{ aspectRatio: '1000 / 100' }}
    >
      <text x="-10" y="160" textLength="1010" lengthAdjust="spacing" fontSize="190" fontWeight="600" fill={LINE}>
        ResumeMax
      </text>
    </svg>
  )
}

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#E3E6E1] pt-14 sm:pt-16">
      <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-[minmax(0,1fr)_minmax(0,180px)_minmax(0,180px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,200px)_minmax(0,200px)]">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-[17px] font-semibold tracking-[-0.02em]" style={{ color: INK }}>
              ResumeMax
            </span>
          </div>
          <p className="mt-4 max-w-[300px] text-[15px] leading-[1.55]" style={{ color: MUTED }}>
            Job prep for placement season, from resume to interview.
          </p>
        </div>

        <LinkColumn id="footer-tools" title="Tools">
          {TOOL_ORDER.map((id) => (
            <li key={id}>
              <Link href={`#${toolAnchor(id)}`} className={LINK_CLASS}>
                <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full" style={{ background: TOOLS[id].strong }} />
                {TOOLS[id].name}
              </Link>
            </li>
          ))}
        </LinkColumn>

        <LinkColumn id="footer-account" title="Account">
          {ACCOUNT_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={LINK_CLASS}>
                {link.label}
              </Link>
            </li>
          ))}
        </LinkColumn>
      </div>

      <p className="mt-16 text-[14px]" style={{ color: MUTED }}>
        © 2026 ResumeMax
      </p>

      <GiantWordmark />
    </footer>
  )
}
