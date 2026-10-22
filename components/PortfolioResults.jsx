'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Check,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  FolderGit2,
  Globe,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Stage, Surface, useInView, useReducedMotion } from '@/components/landing/primitives'
import { DANGER, INK, LINE, MIST, MUTED, SUCCESS, TEXT, TOOLS, WARNING } from '@/components/landing/tokens'
import { cn } from '@/lib/utils'

const TOOL = TOOLS.portfolio

const VERDICTS = {
  strong: { label: 'Strong', dot: SUCCESS },
  good: { label: 'Good', dot: WARNING },
  decent: { label: 'Decent', dot: WARNING },
  needs_work: { label: 'Needs work', dot: DANGER },
}

function verdictFromScore(score) {
  if (score >= 75) return 'strong'
  if (score >= 60) return 'good'
  if (score >= 40) return 'decent'
  return 'needs_work'
}

function getVerdict(verdict, score) {
  return VERDICTS[verdict] ?? VERDICTS[verdictFromScore(score)]
}

function computeSkillsScore(skills) {
  const explicitScore = skills?.score
  if (typeof explicitScore === 'number') return explicitScore

  const present = skills?.present?.length ?? 0
  const missing = skills?.missing?.length ?? 0
  const total = present + missing
  if (!total) return 0
  return Math.round((present / total) * 100)
}

function priorityTone(priority) {
  if (priority <= 2) return { label: 'Urgent', dot: DANGER, fill: 'rgba(240,68,56,0.10)', ring: 'rgba(240,68,56,0.32)' }
  if (priority === 3) return { label: 'Next', dot: WARNING, fill: 'rgba(245,165,36,0.14)', ring: 'rgba(245,165,36,0.5)' }
  return { label: 'Later', dot: MUTED, fill: MIST, ring: LINE }
}

function Dot({ color }) {
  return <span aria-hidden className="inline-block size-1.5 shrink-0 rounded-full" style={{ background: color }} />
}

function SubHeading({ children, className, color = INK }) {
  return (
    <h3 className={cn('text-[14px] font-medium', className)} style={{ color }}>
      {children}
    </h3>
  )
}

function EmptyHint({ title, copy }) {
  return (
    <div className="rounded-[12px] border border-dashed px-4 py-3.5" style={{ borderColor: '#D5D9D3', background: MIST }}>
      <p className="text-[14px] font-medium" style={{ color: INK }}>
        {title}
      </p>
      <p className="mt-1 text-[13.5px] leading-[1.5]" style={{ color: MUTED }}>
        {copy}
      </p>
    </div>
  )
}

function ScoreRing({ score, color }) {
  const reduce = useReducedMotion()
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 80)
    return () => clearTimeout(t)
  }, [])
  const r = 40
  const circ = 2 * Math.PI * r
  const offset = drawn || reduce ? circ - (score / 100) * circ : circ
  return (
    <div className="relative size-[148px] shrink-0">
      <svg viewBox="0 0 96 96" className="size-full -rotate-90" aria-hidden>
        <circle cx="48" cy="48" r={r} fill="none" stroke="#fff" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: reduce ? 'none' : 'stroke-dashoffset 1000ms cubic-bezier(.33,1,.68,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[44px] font-medium leading-none tracking-[-0.04em] tabular-nums" style={{ color: INK }}>{score}</span>
        <span className="mt-1 text-[12px]" style={{ color: TOOL.deep }}>of 100</span>
      </div>
    </div>
  )
}

function PartCard({ part, index, inView }) {
  const empty = part.score == null
  return (
    <Surface className="flex flex-col p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[14px] font-medium" style={{ color: empty ? MUTED : INK }}>{part.name}</p>
        <span className="inline-flex h-6 items-center rounded-full px-2 text-[12px] font-medium tabular-nums" style={{ background: MIST, color: TEXT }}>
          {part.weight}%<span className="sr-only"> of the score</span>
        </span>
      </div>
      {empty ? (
        <p className="mt-auto pt-6 text-[14px]" style={{ color: MUTED }}>Not added</p>
      ) : (
        <>
          <p className="mt-4 text-[34px] font-medium leading-none tracking-[-0.04em] tabular-nums" style={{ color: INK }}>{part.score}</p>
          <span aria-hidden className="relative mt-4 h-1.5 overflow-hidden rounded-full" style={{ background: TOOL.tint }}>
            <span
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
              style={{ width: inView ? `${part.score}%` : '0%', background: TOOL.strong, transitionDelay: `${index * 80}ms` }}
            />
          </span>
        </>
      )}
    </Surface>
  )
}

function NoteCard({ title, items, Icon, color, tint, emptyTitle, emptyCopy }) {
  return (
    <Surface className="p-5 sm:p-6">
      <p className="flex items-center gap-2 text-[15px] font-medium" style={{ color: INK }}>
        <span className="grid size-7 place-items-center rounded-full" style={{ background: tint, color }}>
          <Icon aria-hidden className="size-4" strokeWidth={2} />
        </span>
        {title}
      </p>
      {items?.length ? (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item} className="flex gap-2.5 text-[14.5px] leading-[1.55]" style={{ color: TEXT }}>
              <span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full" style={{ background: color }} />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4"><EmptyHint title={emptyTitle} copy={emptyCopy} /></div>
      )}
    </Surface>
  )
}

function Overview({ result, githubScore, projectScore, skillsScore }) {
  const [ref, inView] = useInView({ threshold: 0.2 })
  const overall = result.score ?? 0
  const verdict = getVerdict(result.verdict, overall)
  const siteScore = result.portfolio_site?.score
  const hasSite = siteScore != null
  const siteIssues = result.portfolio_site?.issues ?? []

  const parts = [
    { name: 'GitHub profile', weight: 20, score: githubScore },
    { name: 'Projects', weight: 40, score: projectScore },
    { name: 'Skills', weight: 30, score: skillsScore },
    { name: 'Portfolio site', weight: 10, score: hasSite ? siteScore : null },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Stage tool="portfolio" className="lg:p-8">
        <div ref={ref} className="grid gap-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-center lg:gap-10">
          <div className="flex items-center gap-5 lg:flex-col lg:items-start">
            <ScoreRing score={overall} color={TOOL.strong} />
            <div>
              <h2 className="text-[14px] font-medium" style={{ color: TOOL.deep }}>Overall score</h2>
              <span className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-medium" style={{ color: INK }}>
                <Dot color={verdict.dot} />
                {verdict.label}
              </span>
              <p className="mt-3 max-w-[260px] text-[14px] leading-[1.55]" style={{ color: TOOL.deep }}>
                Projects count for the most, so fixing your repos moves this score fastest.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <span className="sr-only">How the overall score of {overall} is weighted</span>
            {parts.map((part, i) => <PartCard key={part.name} part={part} index={i} inView={inView} />)}
          </div>
        </div>
      </Stage>

      <div className="grid gap-4 md:grid-cols-2">
        <NoteCard
          title="What’s working on your profile"
          items={result.github_profile?.positives}
          Icon={CircleCheck}
          color={SUCCESS}
          tint="rgba(18,183,106,0.12)"
          emptyTitle="Still room to strengthen this area"
          emptyCopy="Once the profile has clearer positioning, stronger READMEs and better project proof, your strengths will show up here."
        />
        <NoteCard
          title="What to fix on your profile"
          items={result.github_profile?.issues}
          Icon={CircleAlert}
          color={DANGER}
          tint="rgba(240,68,56,0.10)"
          emptyTitle="Nothing flagged here yet"
          emptyCopy="This review didn’t return any specific GitHub profile issues."
        />
      </div>

      {hasSite && (
        <Surface className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <SubHeading className="inline-flex items-center gap-2 text-[15px]">
              <Globe aria-hidden className="size-4 shrink-0" strokeWidth={1.75} style={{ color: MUTED }} />
              Portfolio website
            </SubHeading>
            <span className="text-[13px] tabular-nums" style={{ color: MUTED }}>
              Scored <span className="font-medium" style={{ color: INK }}>{siteScore}</span> out of 100
            </span>
          </div>
          <p className="mt-1 text-[13.5px] leading-[1.5]" style={{ color: MUTED }}>
            How clearly the site positions you, surfaces projects and gives recruiters a next step.
          </p>
          <div className="mt-4">
            {siteIssues.length ? (
              <ul className="space-y-2">
                {siteIssues.map((issue) => (
                  <li key={issue} className="flex gap-2.5 text-[14px] leading-[1.5]" style={{ color: TEXT }}>
                    <CircleAlert aria-hidden className="mt-[3px] size-4 shrink-0" strokeWidth={2} style={{ color: DANGER }} />
                    {issue}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyHint
                title="No major website issues found"
                copy="Your site passes this review. Keep your target role, best projects and contact details visible without scrolling."
              />
            )}
          </div>
        </Surface>
      )}
    </div>
  )
}

const REPO_GRID = 'md:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)] md:gap-x-6'

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

function ReposView({ repos, missingTypes, githubUsername, targetRole }) {
  return (
    <div>
      {repos.length ? (
        <>
          <div aria-hidden className={cn('hidden pb-2.5 text-[12.5px] md:grid', REPO_GRID)} style={{ color: MUTED }}>
            <span>Repo</span>
            <span className="inline-flex items-center gap-1.5">
              <Dot color={DANGER} />
              What a reviewer sees
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Dot color={SUCCESS} />
              Fix
            </span>
          </div>
          <ul>
            {repos.map((repo) => (
              <li
                key={repo.name}
                className={cn('grid gap-y-2 border-t py-4 max-md:first:border-t-0 max-md:first:pt-0', REPO_GRID)}
                style={{ borderColor: LINE }}
              >
                <div className="min-w-0">
                  <p className="flex min-w-0 items-center gap-2 text-[14.5px] font-medium leading-[21px]" style={{ color: INK }}>
                    <FolderGit2 aria-hidden className="size-4 shrink-0" strokeWidth={1.75} style={{ color: MUTED }} />
                    <span className="truncate">{repo.name}</span>
                  </p>
                  {githubUsername && (
                    <Link
                      href={`https://github.com/${githubUsername.replace(/^@/, '')}/${repo.name}`}
                      target="_blank"
                      className="mt-1 inline-flex items-center gap-1 rounded-[6px] text-[13px] font-medium underline-offset-4 hover:underline"
                      style={{ color: TOOL.deep }}
                    >
                      Open on GitHub
                      <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={2} />
                      <span className="sr-only">(opens in a new tab)</span>
                    </Link>
                  )}
                </div>
                <RepoNote label="Issue" dot={DANGER} color={TEXT}>
                  {repo.issue}
                </RepoNote>
                <RepoNote label="Fix" dot={SUCCESS} color={INK}>
                  {repo.fix}
                </RepoNote>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyHint title="No repos to review" copy="This review didn’t return feedback for individual repos." />
      )}

      {!!missingTypes?.length && (
        <div className="mt-1 border-t pt-5" style={{ borderColor: LINE }}>
          <SubHeading>Projects to add for {targetRole || 'this role'}</SubHeading>
          <ul className="mt-3 grid gap-2 md:grid-cols-3">
            {missingTypes.map((item) => (
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
      )}
    </div>
  )
}

function SkillGroup({ title, children }) {
  return (
    <div>
      <SubHeading>{title}</SubHeading>
      <ul className="mt-3 flex flex-wrap gap-2">{children}</ul>
    </div>
  )
}

function NoneYet({ children }) {
  return (
    <li className="text-[13.5px]" style={{ color: MUTED }}>
      {children}
    </li>
  )
}

function SkillsView({ skills }) {
  const present = skills?.present ?? []
  const missing = skills?.missing ?? []
  const first = skills?.priority_gaps ?? []

  return (
    <div className="space-y-6">
      {!!first.length && (
        <div className="rounded-[12px] p-4 sm:p-5" style={{ background: TOOL.tint }}>
          <SubHeading color={TOOL.deep}>Learn these first</SubHeading>
          <p className="mt-1 text-[13.5px] leading-[1.5]" style={{ color: TOOL.deep }}>
            The missing skills that matter most for this role.
          </p>
          <ol className="mt-3.5 flex flex-wrap gap-2">
            {first.map((skill, i) => (
              <li
                key={skill}
                className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white py-1 pl-1.5 pr-3.5 text-[14px] font-medium"
                style={{ color: INK }}
              >
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] tabular-nums"
                  style={{ background: TOOL.tint, color: TOOL.deep }}
                >
                  {i + 1}
                </span>
                {skill}
              </li>
            ))}
          </ol>
        </div>
      )}

      <SkillGroup title="Visible in your repos and site">
        {present.length ? (
          present.map((skill) => (
            <li
              key={skill}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border bg-white py-1 pl-2.5 pr-3 text-[13.5px]"
              style={{ borderColor: LINE, color: INK }}
            >
              <Check aria-hidden className="size-3.5 shrink-0" strokeWidth={2.25} style={{ color: SUCCESS }} />
              {skill}
            </li>
          ))
        ) : (
          <NoneYet>No skills could be verified from your repos yet.</NoneYet>
        )}
      </SkillGroup>

      <SkillGroup title="Missing for this role">
        {missing.length ? (
          missing.map((skill) => (
            <li
              key={skill}
              className="inline-flex min-h-8 items-center rounded-full border border-dashed px-3 py-1 text-[13.5px]"
              style={{ borderColor: '#D5D9D3', background: MIST, color: TEXT }}
            >
              {skill}
            </li>
          ))
        ) : (
          <NoneYet>Nothing major missing for this role.</NoneYet>
        )}
      </SkillGroup>
    </div>
  )
}

function PlanView({ plan }) {
  if (!plan.length) {
    return <EmptyHint title="No action plan returned" copy="Try running the review again to get a step-by-step plan." />
  }

  return (
    <ol>
      {plan.map((item) => {
        const tone = priorityTone(item.priority)
        return (
          <li
            key={item.priority}
            className="grid grid-cols-[26px_minmax(0,1fr)] gap-x-3.5 border-t py-3.5 first:border-t-0 first:pt-0 last:pb-0"
            style={{ borderColor: LINE }}
          >
            <span
              className="-mt-[2.5px] flex size-[26px] items-center justify-center rounded-full text-[12.5px] font-medium tabular-nums"
              style={{ background: tone.fill, boxShadow: `inset 0 0 0 1px ${tone.ring}`, color: INK }}
            >
              <span className="sr-only">Priority </span>
              {item.priority}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                <p className="text-[14.5px] font-medium leading-[21px]" style={{ color: INK }}>
                  {item.action}
                </p>
                <span className="inline-flex h-[21px] shrink-0 items-center gap-1.5 text-[12.5px]" style={{ color: TEXT }}>
                  <Dot color={tone.dot} />
                  {tone.label}
                </span>
              </div>
              <p className="mt-0.5 text-[14px] leading-[1.5]" style={{ color: MUTED }}>
                {item.impact}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function ReportTabs({ result, githubUsername, targetRole }) {
  const [tab, setTab] = useState('repos')
  const repos = result.projects?.repo_feedback ?? []
  const plan = result.action_plan ?? []

  const tabs = [
    { value: 'repos', label: 'Repos', meta: `${repos.length} ${repos.length === 1 ? 'repo' : 'repos'} reviewed` },
    { value: 'skills', label: 'Skills', meta: `Matched to the ${targetRole || 'target'} role` },
    { value: 'plan', label: 'Action plan', meta: 'Most urgent first' },
  ]
  const meta = tabs.find((t) => t.value === tab)?.meta
  const panelClass = 'rounded-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0D0F0E]'

  return (
    <Surface className="p-4 sm:p-7">
      <Tabs value={tab} onValueChange={(value) => setTab(value)} className="gap-0">
        <div className="flex items-center justify-between gap-4">
          <TabsList aria-label="Report sections" className="h-10 w-full bg-[#F1F3EF] sm:w-fit">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="px-3 text-[14px] text-[#646A66] focus-visible:ring-0 data-[active]:bg-white data-[active]:text-[#0D0F0E] sm:px-4"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <p className="hidden text-[13px] sm:block" style={{ color: MUTED }}>
            {meta}
          </p>
        </div>

        <div className="mt-5">
          <TabsContent value="repos" className={panelClass}>
            <ReposView
              repos={repos}
              missingTypes={result.projects?.missing_project_types}
              githubUsername={githubUsername}
              targetRole={targetRole}
            />
          </TabsContent>
          <TabsContent value="skills" className={panelClass}>
            <SkillsView skills={result.skills} />
          </TabsContent>
          <TabsContent value="plan" className={panelClass}>
            <PlanView plan={plan} />
          </TabsContent>
        </div>
      </Tabs>
    </Surface>
  )
}

export default function PortfolioResults({
  result,
  githubUsername,
  targetRole,
}) {
  if (!result) return null

  const githubScore = result.github_profile?.score ?? 0
  const projectScore = result.projects?.score ?? 0
  const skillsScore = computeSkillsScore(result.skills)

  return (
    <div className="flex flex-col gap-6">
      <Overview
        result={result}
        githubScore={githubScore}
        projectScore={projectScore}
        skillsScore={skillsScore}
      />
      <ReportTabs result={result} githubUsername={githubUsername} targetRole={targetRole} />
    </div>
  )
}
