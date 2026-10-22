export const INK = '#0D0F0E'
export const TEXT = '#3B403D'
export const MUTED = '#646A66'
export const LINE = '#E3E6E1'
export const MIST = '#F4F6F2'
export const PAPER = '#FFFFFF'

export const SUCCESS = '#12B76A'
export const WARNING = '#F5A524'
export const DANGER = '#F04438'

// One pastel "sticky note" per tool. tint = stage background, strong = dots/fills, deep = text on tint.
export const TOOLS = {
  resume: { id: 'resume', name: 'Resume check', pro: false, tint: '#D9F6E6', strong: '#12B76A', deep: '#065F3B' },
  cover: { id: 'cover', name: 'Cover letters', pro: true, tint: '#FFF1BF', strong: '#F2B705', deep: '#6E4E00' },
  outreach: { id: 'outreach', name: 'Cold outreach', pro: true, tint: '#FFE3D3', strong: '#FF7A45', deep: '#9A3412' },
  interview: { id: 'interview', name: 'Interview prep', pro: true, tint: '#EEE7FF', strong: '#8B5CF6', deep: '#5B21B6' },
  portfolio: { id: 'portfolio', name: 'Portfolio review', pro: true, tint: '#FFE3EE', strong: '#EC4899', deep: '#9D174D' },
}

export const TOOL_ORDER = ['resume', 'portfolio', 'cover', 'outreach', 'interview']

// Where each tool sits in a real job hunt; drives the sticky step navigation.
export const JOURNEY = [
  { stage: 'Before you apply', tools: ['resume', 'portfolio'] },
  { stage: 'When you apply', tools: ['cover'] },
  { stage: 'After you apply', tools: ['outreach'] },
  { stage: 'Before the interview', tools: ['interview'] },
]

export const toolAnchor = (id) => `tool-${id}`

// Shared sample persona so every mock tells one consistent story.
export const PERSONA = {
  name: 'Aditi Sharma',
  firstName: 'Aditi',
  degree: 'B.Tech CSE, final year',
  github: 'aditi-codes',
  targetRole: 'Frontend Developer (fresher)',
  company: 'Kestrel Pay',
  city: 'Bengaluru',
  recruiter: 'Priya Nair',
  recruiterTitle: 'Talent Acquisition, Kestrel Pay',
  projects: ['CampusCart', 'FestHub'],
  internship: 'Frontend intern at Juniper Health',
}
