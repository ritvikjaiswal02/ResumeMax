import { INK, MUTED } from './tokens'

const ROWS = [
  { label: 'Paste a job post from', items: ['LinkedIn', 'Naukri', 'Internshala', 'Wellfound', 'Instahyre', 'any careers page'] },
  { label: 'Upload a resume made in', items: ['Canva', 'Word', 'Google Docs', 'Overleaf', 'Figma'] },
]

export default function SourcesStrip() {
  return (
    <div className="grid gap-6 border-y border-[#E3E6E1] py-8 md:grid-cols-2 md:gap-10">
      {ROWS.map((row) => (
        <div key={row.label}>
          <p className="text-[14px]" style={{ color: MUTED }}>{row.label}</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {row.items.map((item) => (
              <li key={item} className="text-[17px] font-medium tracking-[-0.01em]" style={{ color: INK }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
