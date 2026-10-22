'use client'

import { useState } from 'react'
import { MotionConfig, motion } from 'framer-motion'
import {
  Check,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  FolderGit2,
  Github,
  Globe,
  Target,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SectionHeader, SecondaryButton, Stage, Surface, useInView } from '@/components/landing/primitives'
import { DANGER, INK, LINE, MIST, MUTED, PERSONA, SUCCESS, TEXT, TOOLS, WARNING } from '@/components/landing/tokens'
import { cn } from '@/lib/utils'

const TOOL = TOOLS.portfolio
const ROLE = 'Frontend Developer'

const INPUTS = [
  { label: 'GitHub username', value: PERSONA.github, Icon: Github },
  { label: 'Portfolio site', hint: 'Optional', value: 'aditisharma.dev', Icon: Globe },
  { label: 'Target role', value: ROLE, Icon: Target },
]

// Same weighting as the real review (20 / 40 / 30 / 10), so the overall score is worked out, not typed in.
const PARTS = [
  { name: 'GitHub profile', weight: 20, score: 58 },
  { name: 'Projects', weight: 40, score: 61 },
  { name: 'Skills', weight: 30, score: 72 },
  { name: 'Portfolio site', weight: 10, score: 66 },
]
const OVERALL = Math.round(PARTS.reduce((sum, part) => sum + (part.score * part.weight) / 100, 0)) // 64
const VERDICT = 'Good'

const PROFILE_GOOD = [
  'Consistent commit history over the last 6 months',
  'Most of your recent work is in React, which fits the role',
]
const PROFILE_FIX = ['No profile README', 'Bio doesn’t say what role you want']

const REPOS = [
  {
    name: 'campuscart',
    issue: 'No README screenshots and no live link',
    fix: 'Add a 3-line README with a GIF and the deployed URL',
  },
  {
    name: 'festhub',
    issue: 'Everything is in one 900-line App.jsx',
    fix: 'Split it into components and add a folder structure section to the README',
  },
  {
    name: 'dsa-practice',
    issue: 'Pinned, but it’s practice solutions that say little to a frontend recruiter',
    fix: 'Unpin it and pin festhub plus one TypeScript project',
  },
]

const MISSING_PROJECTS = [
  'A TypeScript project with tests',
  'An app that consumes a real REST API',
  'A deployed dashboard',
]

const SKILLS_PRESENT = ['React', 'JavaScript', 'Node.js', 'CSS', 'Git']
const SKILLS_MISSING = ['TypeScript', 'Jest', 'Redux', 'REST APIs']
const SKILLS_FIRST = ['TypeScript', 'Jest', 'REST APIs']

const PLAN = [
  {
    action: 'Add a GIF and the live link to the campuscart README',
    why: 'Recruiters rarely clone a repo. A GIF and a link show the app working in one click.',
  },
  {
    action: 'Unpin dsa-practice and pin festhub in its place',
    why: 'Pinned repos get opened first, and practice solutions don’t show frontend work.',
  },
  {
    action: 'Build a TypeScript app with Jest tests that calls a real REST API',
    why: 'One project covers your top three gaps: TypeScript, Jest and REST APIs.',
  },
  {
    action: 'Add a profile README and put the role you want in your bio',
    why: 'It tells a recruiter what you’re after before they open a single repo.',
  },
  {
    action: 'Split festhub’s App.jsx into components',
    why: 'Anyone who opens the code looks at structure first, and one 900-line file is hard to follow.',
  },
]

const TABS = [
  { value: 'repos', label: 'Repos', meta: `${REPOS.length} repos reviewed` },
  { value: 'skills', label: 'Skills', meta: `Matched to the ${ROLE} role` },
  { value: 'plan', label: 'Action plan', meta: 'Most urgent first' },
]

function priorityTone(priority) {
  if (priority <= 2) return { label: 'Urgent', dot: DANGER, fill: 'rgba(240,68,56,0.10)', ring: 'rgba(240,68,56,0.32)' }
  if (priority === 3) return { label: 'Next', dot: WARNING, fill: 'rgba(245,165,36,0.14)', ring: 'rgba(245,165,36,0.5)' }
  return { label: 'Later', dot: MUTED, fill: MIST, ring: LINE }
}

function Dot({ color }) {
  return <span aria-hidden className="inline-block size-1.5 shrink-0 rounded-full" style={{ background: color }} />
}

function ReportInputs() {
  return (
    <Surface className="p-2.5 sm:p-3">
      <dl className="grid gap-2 md:grid-cols-3">
        {INPUTS.map(({ label, hint, value, Icon }) => (
          <div
            key={label}
            className="min-w-0 rounded-[12px] border px-3.5 pb-2.5 pt-2"
            style={{ background: MIST, borderColor: LINE }}
          >
            <dt className="flex items-center justify-between gap-3 text-[12.5px] leading-5" style={{ color: MUTED }}>
              {label}
              {hint && <span>{hint}</span>}
            </dt>
            <dd className="mt-1 flex min-w-0 items-center gap-2 text-[15px] leading-6" style={{ color: INK }}>
              <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.75} style={{ color: TEXT }} />
              <span className="truncate">{value}</span>
            </dd>
          </div>
        ))}
      </dl>
    </Surface>
  )
}

function NoteList({ title, items, Icon, color }) {
  return (
    <div>
      <p className="text-[12.5px]" style={{ color: MUTED }}>
        {title}
      </p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[14px] leading-[1.5]" style={{ color: TEXT }}>
            <Icon aria-hidden className="mt-[3px] size-4 shrink-0" strokeWidth={2} style={{ color }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Overview() {
  const [tableRef, inView] = useInView({ threshold: 0.35 })

  return (
    <Surface className="p-4 sm:p-6">
      <div className="grid gap-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-10">
        <div>
          <h4 className="text-[14px] font-medium" style={{ color: INK }}>
            Overall score
          </h4>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="flex items-baseline tabular-nums" style={{ color: INK }}>
              <span className="text-[56px] font-medium leading-[0.9] tracking-[-0.045em]">{OVERALL}</span>
              <span aria-hidden className="ml-1 text-[15px]" style={{ color: MUTED }}>
                /100
              </span>
              <span className="sr-only"> out of 100</span>
            </p>
            <span
              className="inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-medium"
              style={{ borderColor: LINE, color: INK }}
            >
              <Dot color={WARNING} />
              {VERDICT}
            </span>
          </div>
          <p className="mt-4 text-[13.5px] leading-[1.55]" style={{ color: MUTED }}>
            Projects count for the most, so fixing your repos moves this score fastest.
          </p>
        </div>

        <table ref={tableRef} className="w-full border-collapse text-left">
          <caption className="sr-only">How the overall score of {OVERALL} is weighted</caption>
          <thead>
            <tr className="text-[12.5px]" style={{ color: MUTED }}>
              <th scope="col" className="pb-2 pr-4 font-normal">
                <span className="sr-only">Part of your profile</span>
              </th>
              <th scope="col" className="pb-2 pr-4 font-normal">
                Weight
              </th>
              <th scope="col" className="w-full pb-2 font-normal">
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {PARTS.map((part, i) => (
              <tr key={part.name} className="border-t" style={{ borderColor: LINE }}>
                <th scope="row" className="whitespace-nowrap py-2.5 pr-4 text-[14px] font-normal" style={{ color: INK }}>
                  {part.name}
                </th>
                <td className="py-2.5 pr-4">
                  <span
                    className="inline-flex h-6 items-center rounded-full px-2 text-[12.5px] font-medium tabular-nums"
                    style={{ background: MIST, color: TEXT }}
                  >
                    {part.weight}%
                  </span>
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full"
                      style={{ background: TOOL.tint }}
                    >
                      <span
                        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out"
                        style={{
                          width: inView ? `${part.score}%` : '0%',
                          background: TOOL.strong,
                          transitionDelay: `${i * 60}ms`,
                        }}
                      />
                    </span>
                    <span className="w-6 shrink-0 text-right text-[14px] font-medium tabular-nums" style={{ color: INK }}>
                      {part.score}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 border-t pt-5" style={{ borderColor: LINE }}>
        <h4 className="text-[14px] font-medium" style={{ color: INK }}>
          GitHub profile
        </h4>
        <div className="mt-3 grid gap-5 md:grid-cols-2 md:gap-10">
          <NoteList title="What’s working" items={PROFILE_GOOD} Icon={CircleCheck} color={SUCCESS} />
          <NoteList title="What to fix" items={PROFILE_FIX} Icon={CircleAlert} color={DANGER} />
        </div>
      </div>
    </Surface>
  )
}

const REPO_GRID = 'md:grid-cols-[148px_minmax(0,1fr)_minmax(0,1fr)] md:gap-x-6'

function RepoNote({ label, dot, color, children }) {
  return (
    <p className="grid grid-cols-[52px_minmax(0,1fr)] text-[14px] leading-[1.5] md:block">
      <span className="inline-flex h-[21px] items-center gap-1.5 text-[13px] md:sr-only" style={{ color: MUTED }}>
        <Dot color={dot} />
        {label}
      </span>
      <span style={{ color }}>{children}</span>
    </p>
  )
}

function ReposView() {
  return (
    <div>
      <div aria-hidden className={cn('hidden pb-2.5 text-[12.5px] md:grid', REPO_GRID)} style={{ color: MUTED }}>
        <span>Repo</span>
        <span className="inline-flex items-center gap-1.5">
          <Dot color={DANGER} />
          Issue
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Dot color={SUCCESS} />
          Fix
        </span>
      </div>
      <ul>
        {REPOS.map((repo) => (
          <li
            key={repo.name}
            className={cn('grid gap-y-2 border-t py-4 max-md:first:border-t-0 max-md:first:pt-0', REPO_GRID)}
            style={{ borderColor: LINE }}
          >
            <p className="flex min-w-0 items-center gap-2 text-[14.5px] font-medium leading-[21px]" style={{ color: INK }}>
              <FolderGit2 aria-hidden className="size-4 shrink-0" strokeWidth={1.75} style={{ color: MUTED }} />
              <span className="truncate">{repo.name}</span>
            </p>
            <RepoNote label="Issue" dot={DANGER} color={TEXT}>
              {repo.issue}
            </RepoNote>
            <RepoNote label="Fix" dot={SUCCESS} color={INK}>
              {repo.fix}
            </RepoNote>
          </li>
        ))}
      </ul>

      <div className="mt-1 border-t pt-5" style={{ borderColor: LINE }}>
        <h4 className="text-[14px] font-medium" style={{ color: INK }}>
          Projects missing for this role
        </h4>
        <ul className="mt-3 grid gap-2 md:grid-cols-3">
          {MISSING_PROJECTS.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 rounded-[12px] px-3.5 py-3 text-[14px] leading-[1.45]"
              style={{ background: MIST, color: INK }}
            >
              <CircleDashed aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2} style={{ color: TOOL.strong }} />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function SkillGroup({ title, children }) {
  return (
    <div>
      <h4 className="text-[14px] font-medium" style={{ color: INK }}>
        {title}
      </h4>
      <ul className="mt-3 flex flex-wrap gap-2">{children}</ul>
    </div>
  )
}

function SkillsView() {
  return (
    <div className="space-y-6">
      <div className="rounded-[12px] p-4 sm:p-5" style={{ background: TOOL.tint }}>
        <h4 className="text-[14px] font-medium" style={{ color: TOOL.deep }}>
          Learn these first
        </h4>
        <p className="mt-1 text-[13.5px] leading-[1.5]" style={{ color: TOOL.deep }}>
          The three missing skills that matter most for this role.
        </p>
        <ol className="mt-3.5 flex flex-wrap gap-2">
          {SKILLS_FIRST.map((skill, i) => (
            <li
              key={skill}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-white pl-1.5 pr-3.5 text-[14px] font-medium"
              style={{ color: INK }}
            >
              <span
                className="flex size-6 items-center justify-center rounded-full text-[12px] tabular-nums"
                style={{ background: TOOL.tint, color: TOOL.deep }}
              >
                {i + 1}
              </span>
              {skill}
            </li>
          ))}
        </ol>
      </div>

      <SkillGroup title="Visible in your repos and site">
        {SKILLS_PRESENT.map((skill) => (
          <li
            key={skill}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border bg-white pl-2.5 pr-3 text-[13.5px]"
            style={{ borderColor: LINE, color: INK }}
          >
            <Check aria-hidden className="size-3.5 shrink-0" strokeWidth={2.25} style={{ color: SUCCESS }} />
            {skill}
          </li>
        ))}
      </SkillGroup>

      <SkillGroup title="Missing for this role">
        {SKILLS_MISSING.map((skill) => (
          <li
            key={skill}
            className="inline-flex h-8 items-center rounded-full border border-dashed px-3 text-[13.5px]"
            style={{ borderColor: '#D5D9D3', background: MIST, color: TEXT }}
          >
            {skill}
          </li>
        ))}
      </SkillGroup>
    </div>
  )
}

function PlanView() {
  return (
    <ol>
      {PLAN.map((step, i) => {
        const priority = i + 1
        const tone = priorityTone(priority)
        return (
          <li
            key={step.action}
            className="grid grid-cols-[26px_minmax(0,1fr)] gap-x-3.5 border-t py-3.5 first:border-t-0 first:pt-0 last:pb-0"
            style={{ borderColor: LINE }}
          >
            <span
              className="-mt-[2.5px] flex size-[26px] items-center justify-center rounded-full text-[12.5px] font-medium tabular-nums"
              style={{ background: tone.fill, boxShadow: `inset 0 0 0 1px ${tone.ring}`, color: INK }}
            >
              <span className="sr-only">Priority </span>
              {priority}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                <p className="text-[14.5px] font-medium leading-[21px]" style={{ color: INK }}>
                  {step.action}
                </p>
                <span className="inline-flex h-[21px] shrink-0 items-center gap-1.5 text-[12.5px]" style={{ color: TEXT }}>
                  <Dot color={tone.dot} />
                  {tone.label}
                </span>
              </div>
              <p className="mt-0.5 text-[14px] leading-[1.5]" style={{ color: MUTED }}>
                {step.why}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

const panelMotion = {
  shown: { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } },
  hidden: { opacity: 0, y: 6, transition: { duration: 0 } },
}

// Panels stay mounted and share one grid cell from md up, so the card keeps the height
// of the tallest view and nothing below it jumps when you switch tabs.
function ReportPanel({ value, active, children }) {
  return (
    <TabsContent
      value={value}
      keepMounted
      className={cn(
        'rounded-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0D0F0E]',
        'md:col-start-1 md:row-start-1 md:!block',
        !active && 'max-md:hidden md:invisible'
      )}
    >
      <motion.div initial={false} animate={active ? 'shown' : 'hidden'} variants={panelMotion}>
        {children}
      </motion.div>
    </TabsContent>
  )
}

function ReportTabs() {
  const [tab, setTab] = useState('repos')
  const meta = TABS.find((t) => t.value === tab)?.meta

  return (
    <Surface className="p-4 sm:p-6">
      <Tabs value={tab} onValueChange={(value) => setTab(value)} className="gap-0">
        <div className="flex items-center justify-between gap-4">
          <TabsList aria-label="Report sections" className="h-10 w-full bg-[#F1F3EF] sm:w-fit">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="px-3 text-[14px] focus-visible:ring-0 sm:px-4">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <p className="hidden text-[13px] sm:block" style={{ color: MUTED }}>
            {meta}
          </p>
        </div>

        <MotionConfig reducedMotion="user">
          <div className="mt-5 md:grid">
            <ReportPanel value="repos" active={tab === 'repos'}>
              <ReposView />
            </ReportPanel>
            <ReportPanel value="skills" active={tab === 'skills'}>
              <SkillsView />
            </ReportPanel>
            <ReportPanel value="plan" active={tab === 'plan'}>
              <PlanView />
            </ReportPanel>
          </div>
        </MotionConfig>
      </Tabs>
    </Surface>
  )
}

export default function PortfolioSection() {
  return (
    <section id="tool-portfolio" data-tool="portfolio" className="scroll-mt-28">
      <SectionHeader
        tool="portfolio"
        title="Make your GitHub look like someone worth hiring."
        description="For tech roles, recruiters open your GitHub before they call you. Enter your username and the role you want, and get a score, repo-by-repo fixes and a 5-step plan for what to change first."
      />

      <Stage tool="portfolio" className="mt-10">
        <h3 className="sr-only">Sample portfolio review for {PERSONA.github}</h3>
        <div className="flex flex-col gap-3 sm:gap-4">
          <ReportInputs />
          <Overview />
          <ReportTabs />
        </div>
      </Stage>

      <div className="mt-8">
        <SecondaryButton href="/portfolio">Review my GitHub</SecondaryButton>
      </div>
    </section>
  )
}
