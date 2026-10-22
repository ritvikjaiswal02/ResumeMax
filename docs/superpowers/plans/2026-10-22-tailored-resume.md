# Career Profile and Tailored Resume Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Users build a career profile once from their resume, then get a tailored, ATS-ready PDF for any job post in one click, with before/after scores and no invented facts.

**Architecture:** Pure logic (profile normalising, honesty enforcement, text rendering, PDF layout) lives in small `lib/profile/*` modules with unit tests. Thin API routes call Gemini once per request (extract, tailor, score) and store rows in two new Supabase tables. The client drives the steps in sequence and renders the PDF in the browser with jsPDF, the same way the cover letter is exported today.

**Tech Stack:** Next.js 14 App Router (plain JS), Supabase (admin client in routes), Gemini 2.5 Flash over REST, jsPDF 4 (already installed), Vitest (new, unit tests only).

**Spec:** `docs/superpowers/specs/2026-10-22-tailored-resume-design.md`

## Global Constraints

- Never add a skill, employer, title, date, degree or number that is not in the profile (anti-goal). Enforced in code by `enforceHonesty`, not only by prompt.
- Ask questions only at profile setup (one checklist) and when a different resume is uploaded. Nothing per job.
- PDF: single column; headings exactly `Summary`, `Skills`, `Experience`, `Projects`, `Education`, `Certifications`; real selectable text; no tables, columns, icons, images; contact as plain text at top.
- Length: one page when total experience < 3 years, otherwise up to two pages.
- Tailored resume is a Pro tool keyed `'tailor'` with `FREE_PRO_LIMIT` (2) free tries; a try is spent only after a successful tailor. Profile build/edit is free. Re-download and filling placeholders spend nothing.
- Tailoring does not touch `profiles.analyses_used` and does not insert `analyses` rows.
- Before and after scores come from the same text-scoring prompt (weights 40/30/20/10 as in `/api/analyze`); never adjusted in code.
- Users' original PDFs are never stored.
- Gemini model and URL as in existing routes: `gemini-2.5-flash:generateContent`, PDF sent inline as base64.
- Every new API route: `export const maxDuration = 60`, Bearer-token auth via `createAdminClient().auth.getUser(token)`, errors as `{ error, message? }`.
- UI uses `components/landing/*` primitives, tokens and the Loader set; copy is plain, no em dashes in user-facing strings.

## Review Focus

1. Non-resume or image-only PDF upload → extraction returns no experience and no education; route answers 422 "We couldn't read a resume in this PDF", nothing saved. (Task 4 test on `isUsableProfile`.)
2. Gemini returns fenced, truncated or partially missing JSON → parsed or a clean 502; `normalizeProfile` fills missing arrays so the UI never crashes on `undefined.map`. (Task 2 tests.)
3. Long careers (8+ roles, 40+ bullets) → PDF spans two pages without cutting a line across the page boundary, and stops at two pages by trimming project bullets, then old roles' bullets, never whole jobs. (Task 3 test.)
4. Non-Latin and typographic characters (₹, é, smart quotes, en/em dashes, `•`, Devanagari names) → jsPDF's built-in Helvetica can't draw them; `toPdfSafe` maps known ones and drops the rest so the PDF never shows garbage glyphs. (Task 3 test.)
5. Empty sections (no projects, no certifications, no summary) → section omitted from preview, text and PDF, never an empty heading. (Task 2 and Task 3 tests.)

---

## File Structure

| File | Responsibility |
|---|---|
| `vitest.config.mjs` | Unit test runner with `@/` alias |
| `supabase/2026-10-22-tailored-resume.sql` | Tables, RLS, `free_pro_uses` note; run once in the Supabase SQL editor |
| `lib/profile/schema.js` | `normalizeProfile`, `isUsableProfile`, `yearsOfExperience`, `profileToText`, `carryOverProfile` |
| `lib/profile/honesty.js` | `enforceHonesty`, `mergeSkillLists` |
| `lib/profile/fill.js` | `placeholderCount`, `applyFillsToResume`, `applyFillsToProfile` |
| `lib/profile/prompts.js` | `extractProfilePrompt`, `tailorPrompt`, `scorePrompt` |
| `lib/gemini.js` | `callGeminiJSON` (fetch + fence stripping + JSON parse) |
| `lib/resume-pdf.js` | `toPdfSafe`, `buildResumePdf` (jsPDF layout, browser and Node) |
| `lib/plan.js` | add `'tailor'` to `PRO_TOOLS` |
| `lib/api.js` | client fetchers for the new routes |
| `app/api/profile/route.js` | GET / POST (build from PDF) / PATCH (edit, confirm, decline) |
| `app/api/tailor/route.js` | GET list / POST tailor |
| `app/api/tailor/[id]/route.js` | GET one / PATCH fills |
| `app/api/tailor/[id]/score/route.js` | POST before/after scores |
| `components/landing/tokens.js` | add `TOOLS.tailor` |
| `components/tailor/SkillChecklist.jsx` | one-time / ongoing Yes-No skill list |
| `components/tailor/ResumePreview.jsx` | HTML preview with inline `[X]` inputs |
| `components/tailor/TailorFlow.jsx` | the whole one-click flow (state machine), used by analyze tab and profile page |
| `app/profile/page.jsx`, `app/profile/layout.jsx` | profile page |
| `components/landing/AppNav.jsx` | "Profile" link |
| `app/analyze/page.jsx` | "Tailored resume" tab |
| `app/history/page.jsx` | list tailored resumes |

---

### Task 1: Test runner and database

**Files:**
- Create: `vitest.config.mjs`, `supabase/2026-10-22-tailored-resume.sql`, `lib/profile/schema.test.js`
- Modify: `package.json` (devDependency `vitest@2.1.9`, script `"test": "vitest run"`)

**Interfaces:**
- Produces: `npm test` runs `**/*.test.js`; tables `career_profiles`, `tailored_resumes`.

- [ ] **Step 1: Install and configure Vitest**

Run: `npm install -D vitest@2.1.9`. `vitest.config.mjs`: `environment: 'node'`, `resolve.alias: { '@': <repo root> }`, `include: ['lib/**/*.test.js']`.

- [ ] **Step 2: Add a smoke test and run it**

`lib/profile/schema.test.js` with `it('runs', () => expect(1).toBe(1))`.
Run: `npm test` — Expected: 1 passed.

- [ ] **Step 3: Write the SQL file**

```sql
create table if not exists career_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  confirmed_skills text[] not null default '{}',
  declined_skills  text[] not null default '{}',
  suggested_skills text[] not null default '{}',
  source_resume_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists tailored_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid references analyses(id) on delete set null,
  job_title text, company text, jd_text text not null,
  resume jsonb not null, changes jsonb not null default '{}',
  score_before int, score_after int,
  created_at timestamptz not null default now()
);
create index if not exists tailored_resumes_user_created on tailored_resumes(user_id, created_at desc);
alter table career_profiles enable row level security;
alter table tailored_resumes enable row level security;
create policy "own profile" on career_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tailored" on tailored_resumes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Header comment: "Run once in Supabase → SQL editor. `use_free_pro()` already accepts any tool key, so no change there." Verify that claim by reading `use_free_pro` in the Supabase dashboard; if it whitelists tools, add `'tailor'` there and note it in the file.

- [ ] **Step 4: Ask the owner to run the SQL in Supabase, then confirm both tables exist** (Table editor shows them).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.mjs supabase/ lib/profile/schema.test.js
git commit -m "chore: add vitest and tailored resume tables"
```

---

### Task 2: Profile schema and text rendering

**Files:**
- Create: `lib/profile/schema.js`
- Test: `lib/profile/schema.test.js` (replace smoke test)

**Interfaces:**
- Produces:
  - `normalizeProfile(raw: object) -> ProfileData` — ProfileData is the spec's shape: `{ contact:{name,email,phone,location,links:[{label,url}]}, summary, experience:[{id,company,title,location,start,end,current,bullets:[{id,text}]}], projects:[{id,name,link,tech:[],bullets:[{id,text}]}], education:[{school,degree,field,start,end,grade}], skills:[], certifications:[{name,issuer,year}], extras:[], skill_notes:{} }`. Every array present; strings trimmed; ids kept if present, else generated `e1`, `e1b1`, `p1`, `p1b1` (stable, positional); bullets given as plain strings become `{id,text}`; skills de-duplicated case-insensitively.
  - `isUsableProfile(data: ProfileData) -> boolean` — true when there is ≥1 experience or ≥1 education entry AND a contact name.
  - `yearsOfExperience(data: ProfileData, now?: Date) -> number` — sum of role spans (end or now), overlapping spans counted once, parsing `"Jan 2022"`, `"2022"`, `"Present"`.
  - `profileToText(data: ProfileData) -> string` — plain resume text: name, contact line, then sections in order Summary, Skills, Experience, Projects, Education, Certifications; empty sections omitted; bullets prefixed `- `.
  - `carryOverProfile(prev: Row|null, next: ProfileData) -> ProfileData` — returns `next` with `skill_notes` from prev and, for each next bullet whose company matches and whose text similarity to a prev bullet ≥ 0.8 (token Jaccard), the prev bullet's text if prev contains digits the new one lacks (keeps filled numbers).

- [ ] **Step 1: Write failing tests**

```js
describe('normalizeProfile', () => {
  it('fills every array and generates stable ids', () => {
    const p = normalizeProfile({ contact: { name: ' Aditi ' }, experience: [{ company: 'Juniper', bullets: ['Built X', 'Built Y'] }] })
    expect(p.contact.name).toBe('Aditi')
    expect(p.projects).toEqual([]); expect(p.certifications).toEqual([]); expect(p.skill_notes).toEqual({})
    expect(p.experience[0].id).toBe('e1')
    expect(p.experience[0].bullets).toEqual([{ id: 'e1b1', text: 'Built X' }, { id: 'e1b2', text: 'Built Y' }])
  })
  it('keeps existing ids and dedupes skills', () => {
    const p = normalizeProfile({ contact: { name: 'A' }, skills: ['React', 'react', ' Git '], experience: [{ id: 'x9', bullets: [{ id: 'x9b4', text: 'T' }] }] })
    expect(p.skills).toEqual(['React', 'Git'])
    expect(p.experience[0].bullets[0].id).toBe('x9b4')
  })
  it('survives null and garbage', () => {
    expect(() => normalizeProfile(null)).not.toThrow()
    expect(normalizeProfile({ experience: 'oops' }).experience).toEqual([])
  })
})
it('isUsableProfile rejects a profile with no name or no history', () => {
  expect(isUsableProfile(normalizeProfile({ contact: { name: 'A' } }))).toBe(false)
  expect(isUsableProfile(normalizeProfile({ education: [{ school: 'BITS' }] }))).toBe(false)
  expect(isUsableProfile(normalizeProfile({ contact: { name: 'A' }, education: [{ school: 'BITS' }] }))).toBe(true)
})
it('yearsOfExperience merges overlaps and handles Present', () => {
  const d = normalizeProfile({ contact: { name: 'A' }, experience: [
    { start: 'Jan 2020', end: 'Jan 2022' }, { start: 'Jan 2021', end: 'Present' } ] })
  expect(yearsOfExperience(d, new Date('2024-01-01'))).toBeCloseTo(4, 0)
})
it('profileToText orders sections and omits empty ones', () => {
  const t = profileToText(normalizeProfile({ contact: { name: 'Aditi', email: 'a@x.in' }, skills: ['React'],
    experience: [{ company: 'Juniper', title: 'Intern', start: '2023', end: '2024', bullets: ['Built X'] }] }))
  expect(t.indexOf('Skills')).toBeLessThan(t.indexOf('Experience'))
  expect(t).toContain('- Built X')
  expect(t).not.toContain('Projects'); expect(t).not.toContain('Certifications'); expect(t).not.toContain('Summary')
})
it('carryOverProfile keeps a filled number on a matching bullet', () => {
  const prev = { data: normalizeProfile({ contact: { name: 'A' }, skill_notes: { AWS: 'EC2 for CampusCart' },
    experience: [{ company: 'Juniper', bullets: ['Cut load time by 40% for the dashboard'] }] }) }
  const next = normalizeProfile({ contact: { name: 'A' }, experience: [{ company: 'Juniper', bullets: ['Cut load time by [X]% for the dashboard'] }] })
  const out = carryOverProfile(prev, next)
  expect(out.experience[0].bullets[0].text).toContain('40%')
  expect(out.skill_notes).toEqual({ AWS: 'EC2 for CampusCart' })
})
```

- [ ] **Step 2: Run** `npm test` — Expected: FAIL, functions not exported.
- [ ] **Step 3: Implement the five functions in `lib/profile/schema.js`.**
- [ ] **Step 4: Run** `npm test` — Expected: all pass.
- [ ] **Step 5: Commit** `git commit -m "feat: career profile schema helpers"`

---

### Task 3: PDF layout

**Files:**
- Create: `lib/resume-pdf.js`, `lib/resume-pdf.test.js`

**Interfaces:**
- Consumes: `ProfileData`, `yearsOfExperience` (Task 2).
- Produces:
  - `toPdfSafe(s: string) -> string` — maps `‘’`→`'`, `“”`→`"`, `–—`→`-`, `•`→`-`, `…`→`...`, `₹`→`Rs.`, non-breaking space→space; then strips any char outside Latin-1 (`\u0000-ÿ`).
  - `buildResumePdf(resume: ProfileData, { jsPDF }) -> jsPDF doc` — caller passes the constructor (browser: `(await import('jspdf')).jsPDF`; tests: imported directly). A4, margins 18 mm, Helvetica; name 18pt bold; contact 9.5pt on one line joined by ` | `; section headings 11pt bold uppercase-free exactly as in Global Constraints with a 0.3 pt rule under; body 10pt, line height 1.35; role line `Title, Company` bold left and dates right-aligned on the same baseline (`doc.text(..., { align: 'right' })`); bullets drawn as `- ` + wrapped text with hanging indent. Page breaks only between whole lines. Max pages: 1 if `yearsOfExperience < 3`, else 2; if over, drop the last bullet of the last project repeatedly, then whole last projects; if still over, trim the oldest role's bullets down to 2, then the next oldest, and so on; re-layout after each cut. Never drop experience entries or education.
  - `layoutPageCount(resume, { jsPDF }) -> number` (exported for tests).

- [ ] **Step 1: Write failing tests**

```js
import { jsPDF } from 'jspdf'
const opts = { jsPDF }
it('toPdfSafe maps typography and drops unsupported scripts', () => {
  expect(toPdfSafe('“Hi” – ₹500 • ok…')).toBe('"Hi" - Rs.500 - ok...')
  expect(toPdfSafe('Aditi अदिति')).toBe('Aditi ')
  expect(toPdfSafe('café')).toBe('café')
})
it('writes the headings in order as real text and omits empty sections', () => {
  const doc = buildResumePdf(normalizeProfile(SAMPLE_NO_PROJECTS), opts)
  const raw = doc.output()  // uncompressed by default
  expect(raw).toMatch(/\(Summary\) Tj[\s\S]*\(Skills\) Tj[\s\S]*\(Experience\) Tj[\s\S]*\(Education\) Tj/)
  expect(raw).not.toContain('(Projects) Tj')
})
it('keeps a fresher to one page by trimming project bullets', () => {
  expect(layoutPageCount(normalizeProfile(FRESHER_WITH_HUGE_PROJECTS), opts)).toBe(1)
})
it('lets a 9-year career use two pages but never three, keeping every job', () => {
  const r = normalizeProfile(SENIOR_9_ROLES_45_BULLETS)
  expect(layoutPageCount(r, opts)).toBe(2)
  const raw = buildResumePdf(r, opts).output()
  for (const e of r.experience) expect(raw).toContain(`${e.title}, ${e.company}`)
})
```

Define the three fixtures at the top of the test file: `SAMPLE_NO_PROJECTS` (summary, skills, 1 role, 1 education, no projects), `FRESHER_WITH_HUGE_PROJECTS` (1 internship 2023–2024, 4 projects × 8 long bullets), `SENIOR_9_ROLES_45_BULLETS` (9 roles 2015–Present, 5 bullets each).

If jsPDF splits a role line into separate `Tj` operators, assert on `(Company` prefix as written above rather than exact strings.

- [ ] **Step 2: Run** `npm test lib/resume-pdf.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement `toPdfSafe`, `buildResumePdf`, `layoutPageCount`.** Lay out into a list of line records first (`{ text, font, size, x, align }`), paginate the list, then draw; `layoutPageCount` paginates without drawing.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat: ATS resume PDF layout"`

---

### Task 4: Gemini helper, prompts, and the profile API

**Files:**
- Create: `lib/gemini.js`, `lib/gemini.test.js`, `lib/profile/prompts.js`, `app/api/profile/route.js`
- Modify: `lib/api.js`

**Interfaces:**
- Consumes: `normalizeProfile`, `isUsableProfile`, `carryOverProfile` (Task 2).
- Produces:
  - `parseModelJSON(text: string) -> object` — strips ``` fences, falls back to the first `{...}` block; throws `Error('bad_json')`.
  - `callGeminiJSON({ parts: Array, temperature?: number }) -> Promise<object>` — POST to the Gemini URL with `GEMINI_API_KEY`, returns `parseModelJSON` of the first candidate's text; throws `Error('gemini_failed')` on non-2xx.
  - `extractProfilePrompt(today: string) -> string` — asks for ProfileData JSON (spec shape, bullets as plain strings is fine) plus `"suggested_skills": [up to 12 skills commonly expected for the roles this person targets that do NOT appear anywhere in the resume]`; rules: copy facts verbatim, never infer numbers, keep every bullet, dates as written.
  - `tailorPrompt(profile: ProfileData, confirmed: string[], jd: string) -> string`
  - `scorePrompt(resumeText: string, jd: string) -> string` — returns `{ "score": 0-100 }` using the 40/30/20/10 weights and calibration bullets copied verbatim from `app/api/analyze/route.js` lines 145–154, with "resume text below" instead of "attached PDF".
  - Routes (all Bearer auth):
    - `GET /api/profile` → `{ profile: Row | null }` (Row = `career_profiles` row).
    - `POST /api/profile` multipart `resume` (validated with `validatePDFMeta`/`validatePDFBytes`) → extract with Gemini (PDF inline + `extractProfilePrompt`), `normalizeProfile`, `isUsableProfile` else 422 `{ error: 'unreadable_resume', message: "We couldn't read a resume in this PDF. Try exporting it again as a PDF with real text." }`; if a row exists, `carryOverProfile(prev, data)` and keep its three skill arrays; `suggested_skills` = model suggestions minus skills already in profile, confirmed or declined (case-insensitive), merged with existing suggested; upsert; respond `{ profile: Row, checklist: string[] }` where checklist is the new suggestions (empty when replacing and nothing new).
    - `PATCH /api/profile` JSON `{ data?: ProfileData, confirm?: [{ skill, note? }], decline?: string[] }` → applies via `mergeSkillLists` (Task 5) and `normalizeProfile`; responds `{ profile: Row }`.
  - Client in `lib/api.js`: `getProfile(token)`, `buildProfile(file, token)`, `updateProfile(body, token)` — each throws the JSON body on non-2xx, like `analyzeResume`.

- [ ] **Step 1: Failing tests for `parseModelJSON`**

```js
it('parses fenced json', () => expect(parseModelJSON('```json\n{"a":1}\n```')).toEqual({ a: 1 }))
it('parses json with chatter around it', () => expect(parseModelJSON('Sure! {"a":2} hope that helps')).toEqual({ a: 2 }))
it('throws bad_json on truncated output', () => expect(() => parseModelJSON('{"a":')).toThrow('bad_json'))
```

- [ ] **Step 2: Run** — FAIL. **Step 3: Implement `lib/gemini.js`.** **Step 4: Run** — PASS.
- [ ] **Step 5: Write `lib/profile/prompts.js` and `app/api/profile/route.js`** (GET/POST/PATCH as above; `export const maxDuration = 60`). Gemini or JSON failure → 502 `{ error: 'extract_failed', message: 'Reading your resume failed. Please try again.' }`. PATCH may land before Task 5 exists only as a stub; implement it fully in Task 5 Step 5.
- [ ] **Step 6: Manual check with the dev server** (signed-in browser, DevTools console):

```js
const t = JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => k.includes('auth-token')))).access_token
const fd = new FormData(); fd.append('resume', fileFromInput)   // any real resume PDF
await (await fetch('/api/profile', { method: 'POST', headers: { Authorization: `Bearer ${t}` }, body: fd })).json()
```

Expected: `profile.data.experience[0].bullets[0].id === 'e1b1'`, non-empty `checklist`; a second POST of the same file returns an empty or shorter `checklist` and the same `confirmed_skills`. A photo-only PDF returns 422 `unreadable_resume`.

- [ ] **Step 7: Commit** `git commit -m "feat: career profile API"`

---

### Task 5: Honesty enforcement and skill lists

**Files:**
- Create: `lib/profile/honesty.js`, `lib/profile/honesty.test.js`
- Modify: `app/api/profile/route.js` (PATCH uses `mergeSkillLists`)

**Interfaces:**
- Consumes: `ProfileData`, `normalizeProfile`.
- Produces:
  - `enforceHonesty(tailored: TailorOutput, profile: ProfileData, confirmed: string[]) -> { resume: ProfileData, removed: string[] }` where `TailorOutput = { resume: ProfileData, equivalents: [{ skill, evidence_bullet_id }], gaps: string[], changes: string[] }` and each tailored bullet carries `source_id` (the profile bullet it came from). Rules, each producing a `removed` entry:
    1. Experience: keep only entries whose `id` exists in the profile; force `company`, `title`, `start`, `end`, `current`, `location` back to the profile's values. Any profile role missing from the output is re-added with its original bullets (jobs are never dropped).
    2. Bullets: drop any bullet whose `source_id` is not a bullet of the same entry in the profile; for kept bullets, every number token (`/\d[\d,.]*\s?%?/`) must appear in the source bullet text, otherwise revert to the source text. Set `id = source_id`.
    3. Projects: same as experience, except dropping whole projects is allowed.
    4. Education and certifications: replaced with the profile's.
    5. Skills: keep a skill if it matches (case-insensitive, trimmed) a profile skill, a confirmed skill, or an `equivalents` entry whose `evidence_bullet_id` exists in the profile; otherwise remove.
    6. Contact: replaced with the profile's.
  - `mergeSkillLists(row: { confirmed_skills, declined_skills, suggested_skills, data }, { confirm = [], decline = [], suggest = [] }) -> { confirmed_skills, declined_skills, suggested_skills, data }` — confirm adds to `confirmed_skills` and `data.skills`, stores `note` in `data.skill_notes[skill]`, removes from declined/suggested; decline adds to declined, removes from suggested; suggest adds only skills not already in profile skills, confirmed or declined. All comparisons case-insensitive, original casing of first occurrence kept.

- [ ] **Step 1: Failing tests**

```js
const profile = normalizeProfile({ contact: { name: 'Aditi' }, skills: ['React', 'Node.js'],
  experience: [{ id: 'e1', company: 'Juniper', title: 'Intern', start: '2023', end: '2024',
    bullets: [{ id: 'e1b1', text: 'Built a Node.js API for 3 clinics' }] }] })
const out = (resume, extra = {}) => ({ resume: normalizeProfile(resume), equivalents: [], gaps: [], changes: [], ...extra })

it('removes an unconfirmed skill but keeps a confirmed one', () => {
  const r = enforceHonesty(out({ ...profile, skills: ['React', 'AWS', 'Jest'] }), profile, ['Jest'])
  expect(r.resume.skills).toEqual(['React', 'Jest']); expect(r.removed).toContain('skill:AWS')
})
it('allows a job-worded equivalent backed by a real bullet', () => {
  const r = enforceHonesty(out({ ...profile, skills: ['REST APIs'] }, { equivalents: [{ skill: 'REST APIs', evidence_bullet_id: 'e1b1' }] }), profile, [])
  expect(r.resume.skills).toContain('REST APIs')
})
it('reverts a bullet that invents a number', () => {
  const tailored = { ...profile, experience: [{ ...profile.experience[0], title: 'Senior Engineer',
    bullets: [{ id: 'x', source_id: 'e1b1', text: 'Built REST APIs serving 50,000 users across 3 clinics' }] }] }
  const r = enforceHonesty(out(tailored), profile, [])
  expect(r.resume.experience[0].bullets[0].text).toBe('Built a Node.js API for 3 clinics')
  expect(r.resume.experience[0].title).toBe('Intern')
})
it('re-adds a dropped job', () => {
  const r = enforceHonesty(out({ ...profile, experience: [] }), profile, [])
  expect(r.resume.experience.map(e => e.id)).toEqual(['e1'])
})
it('keeps a rewrite that adds an [X] placeholder', () => {
  const tailored = { ...profile, experience: [{ ...profile.experience[0],
    bullets: [{ id: 'x', source_id: 'e1b1', text: 'Built REST APIs for 3 clinics, cutting response time by [X]%' }] }] }
  const r = enforceHonesty(out(tailored), profile, [])
  expect(r.resume.experience[0].bullets[0]).toEqual({ id: 'e1b1', text: 'Built REST APIs for 3 clinics, cutting response time by [X]%' })
})
it('mergeSkillLists confirm, decline and suggest', () => {
  const row = { confirmed_skills: [], declined_skills: ['Go'], suggested_skills: ['AWS', 'Docker'], data: profile }
  const m = mergeSkillLists(row, { confirm: [{ skill: 'aws', note: 'EC2' }], decline: ['Docker'], suggest: ['go', 'React', 'Kafka'] })
  expect(m.confirmed_skills).toEqual(['aws']); expect(m.data.skill_notes).toEqual({ aws: 'EC2' })
  expect(m.declined_skills).toEqual(['Go', 'Docker']); expect(m.suggested_skills).toEqual(['Kafka'])
  expect(m.data.skills).toContain('aws')
})
```

- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS.
- [ ] **Step 5: Finish PATCH in `app/api/profile/route.js`** using `mergeSkillLists` then `normalizeProfile(data)`; set `updated_at`.
- [ ] **Step 6: Commit** `git commit -m "feat: honesty enforcement and skill lists"`

---

### Task 6: Placeholder fills

**Files:**
- Create: `lib/profile/fill.js`, `lib/profile/fill.test.js`

**Interfaces:**
- Produces:
  - `placeholderCount(resume: ProfileData) -> number` — count of `[X]` across summary and all bullets.
  - `applyFillsToResume(resume, fills: { [bulletId]: string[] }) -> ProfileData` — replaces the n-th `[X]` in that bullet with `fills[id][n]` when non-empty (trimmed); untouched otherwise.
  - `applyFillsToProfile(profileData, filledResume, fills) -> ProfileData` — for each bullet id in `fills` whose filled text has no `[X]` left, set the profile bullet with that id to the filled text.

- [ ] **Step 1: Failing tests**

```js
const resume = normalizeProfile({ contact: { name: 'A' }, experience: [{ id: 'e1', bullets: [{ id: 'e1b1', text: 'Cut load by [X]% for [X] users' }] }] })
it('counts placeholders', () => expect(placeholderCount(resume)).toBe(2))
it('fills in order and leaves blanks', () => {
  expect(applyFillsToResume(resume, { e1b1: ['40', ''] }).experience[0].bullets[0].text).toBe('Cut load by 40% for [X] users')
})
it('saves a fully filled bullet back to the profile only', () => {
  const full = applyFillsToResume(resume, { e1b1: ['40', '2,000'] })
  expect(applyFillsToProfile(resume, full, { e1b1: ['40', '2,000'] }).experience[0].bullets[0].text).toBe('Cut load by 40% for 2,000 users')
  const half = applyFillsToResume(resume, { e1b1: ['40', ''] })
  expect(applyFillsToProfile(resume, half, { e1b1: ['40', ''] }).experience[0].bullets[0].text).toBe('Cut load by [X]% for [X] users')
})
```

- [ ] **Step 2–4:** Run (FAIL), implement, run (PASS).
- [ ] **Step 5: Commit** `git commit -m "feat: placeholder fills saved to profile"`

---

### Task 7: Tailor and score API

**Files:**
- Create: `app/api/tailor/route.js`, `app/api/tailor/[id]/route.js`, `app/api/tailor/[id]/score/route.js`
- Modify: `lib/plan.js` (`PRO_TOOLS = ['cover', 'outreach', 'interview', 'portfolio', 'tailor']`), `lib/profile/prompts.js` (fill in `tailorPrompt`), `lib/api.js`

**Interfaces:**
- Consumes: `callGeminiJSON`, `tailorPrompt`, `scorePrompt`, `enforceHonesty`, `mergeSkillLists`, `profileToText`, `applyFillsToResume`, `applyFillsToProfile`, `getProAccess`, `consumeFreeProUse`.
- Produces:
  - `tailorPrompt(profile, confirmed, jd)` asks for `TailorOutput` JSON (Task 5 shape) and states the spec's Tailoring rules verbatim, plus: every bullet must include `source_id`; put job-worded skills only in `equivalents` with the bullet that proves them; list unsupported job skills in `gaps`; `changes` is 3–6 short plain sentences ("Moved React and TypeScript to the top of Skills"); keep `[X]` for unknown numbers; include the `skill_notes` lines as facts the user confirmed.
  - `POST /api/tailor` JSON `{ jd: string, analysis_id?: string }` → 401/403 (`{ error: 'pro_required' }` via `getProAccess(profile, 'tailor')`) / 409 `{ error: 'no_profile' }` / 400 via `validateJD` → Gemini → `enforceHonesty` → insert `tailored_resumes` (`job_title` = first non-empty JD line ≤ 80 chars, as `/api/analyze` does; `company` null) → `mergeSkillLists(row, { suggest: gaps })` saved → `consumeFreeProUse` when access is `'trial'` → `{ id, resume, changes, gaps, removed }`. Gemini/JSON failure → 502, no try spent, no row.
  - `GET /api/tailor` → `{ items: [{ id, job_title, score_before, score_after, created_at }] }` latest 20.
  - `GET /api/tailor/[id]` → `{ item: Row }` (404 if not the user's).
  - `PATCH /api/tailor/[id]` JSON `{ fills }` → `applyFillsToResume` on the row, `applyFillsToProfile` on `career_profiles.data`, both saved → `{ item: Row }`. No try spent.
  - `POST /api/tailor/[id]/score` → `Promise.all` of two `callGeminiJSON` with `scorePrompt(profileToText(profile.data), jd)` and `scorePrompt(profileToText(row.resume), jd)` → update row → `{ score_before, score_after }`. Idempotent: returns stored scores if both already set.
  - `lib/api.js`: `tailorResume(jd, token, analysisId?)`, `scoreTailored(id, token)`, `saveFills(id, fills, token)`, `listTailored(token)`, `getTailored(id, token)`.

- [ ] **Step 1: Implement the prompt, routes and client fetchers** (`export const maxDuration = 60` on each route).
- [ ] **Step 2: Manual check** (dev server, signed in, profile from Task 4 exists), in the console:

```js
const r = await (await fetch('/api/tailor', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ jd: JD_TEXT }) })).json()
await (await fetch(`/api/tailor/${r.id}/score`, { method: 'POST', headers: { Authorization: `Bearer ${t}` } })).json()
```

Expected: `r.resume.experience` ids equal the profile's; every `r.resume.skills` entry is in profile skills, confirmed skills or `equivalents`; `r.gaps` items now appear in `GET /api/profile` → `suggested_skills`; scores are integers 0–100; `/api/usage` → `free_pro_left.tailor` dropped by 1 for a free account and `analyses_used` unchanged; no new row in `analyses`. Third tailor on a free account → 403 `pro_required`.

- [ ] **Step 3: Run** `npm test` — Expected: all unit tests still pass.
- [ ] **Step 4: Commit** `git commit -m "feat: tailor and score API"`

---

### Task 8: Tailor flow UI

**Files:**
- Create: `components/tailor/SkillChecklist.jsx`, `components/tailor/ResumePreview.jsx`, `components/tailor/TailorFlow.jsx`
- Modify: `components/landing/tokens.js` (`TOOLS.tailor = { id: 'tailor', name: 'Tailored resume', pro: true, tint: '#DDF0FF', strong: '#2E90FA', deep: '#1849A9' }`; leave `TOOL_ORDER` and `JOURNEY` unchanged so the landing page is untouched)

**Interfaces:**
- Consumes: Task 4/7 client fetchers, `buildResumePdf`, `placeholderCount`, `applyFillsToResume`, `Loader` (`ProgressSteps`, `WritingSkeleton`, `Dots`, `Spinner`), primitives.
- Produces:
  - `<SkillChecklist skills={string[]} onDone={(confirm, decline) => void} onSkip={() => void} busy={boolean} />` — each skill: name, *Yes, I've used it* / *No* buttons; Yes reveals an optional one-line input "Where did you use it?"; footer "Save" + "Skip for now".
  - `<ResumePreview resume={ProfileData} fills={object} onFill={(bulletId, index, value) => void} />` — white page look, same section order/omission as the PDF; each `[X]` becomes a small inline input highlighted in `TOOLS.tailor.tint`.
  - `<TailorFlow session usage resumeFile? jobDescription? analysisId? onUsageChange />` — states: `loading-profile` → `needs-profile` (uses `resumeFile` if given, else an upload zone) → `building` (`ProgressSteps` "Reading your resume", steps `['Reading every section', 'Pulling out your experience', 'Finding skills you might have']`, expected 20) → `checklist` (when `checklist.length`) → `ready` (JD textarea prefilled from `jobDescription`, button "Tailor my resume", Pro status line like other tools) → `tailoring` (`WritingSkeleton` tool `tailor`, "Tailoring your resume", expected 20) → `scoring` (preview visible; score card shows `Spinner`) → `done`. Done view: score card `Before {score_before} → After {score_after}` with the delta, "What changed" list from `changes`, a muted "Left out (not on your profile)" list from `gaps` with a link "Answer these on your profile", the preview, and actions **Download PDF** (warns with a confirm dialog "You still have N numbers to fill. Download anyway?" when `placeholderCount > 0`) and **Tailor for another job**. Fills are debounced 800 ms and saved with `saveFills`. On analyze page, when a profile exists and `resumeFile.name !== profile.source_resume_name`, show the one-line banner "Update your profile from this resume?" with **Update** (POST profile again) / **Keep my profile**. 403 `pro_required` → locked state like `GenerateButton` 'Unlock with Pro' linking `/pricing`. Errors use the ErrorNote style from `components/analyze/ProTools.jsx`.

- [ ] **Step 1: Build the three components.** Download: `const { jsPDF } = await import('jspdf'); buildResumePdf(applyFillsToResume(resume, fills), { jsPDF }).save(`${slug(name)}_${slug(job_title)}.pdf`)`.
- [ ] **Step 2: Temporary visual check** — add `app/dev-tailor/page.jsx` (with the analyze `layout.jsx`) rendering `SkillChecklist` and `ResumePreview` with a fixture resume containing two `[X]`; `preview_start` → screenshot at desktop and 375 px width; confirm inputs replace `[X]`, no horizontal scroll. Delete `app/dev-tailor/` afterwards.
- [ ] **Step 3: Commit** `git commit -m "feat: tailor flow UI"`

---

### Task 9: Wire into analyze, profile page, nav and history

**Files:**
- Create: `app/profile/page.jsx`, `app/profile/layout.jsx` (same as `app/analyze/layout.jsx`)
- Modify: `app/analyze/page.jsx`, `components/analyze/ProTools.jsx` (`TOOL_ICONS.tailor = Wand2`, `NextSteps` gets a first card for `tailor`), `components/landing/AppNav.jsx` (link `{ id: 'profile', href: '/profile', label: 'Profile' }` after History), `app/history/page.jsx`

**Interfaces:**
- Consumes: `TailorFlow`, `SkillChecklist`, fetchers from Tasks 4 and 7.
- Produces: user-facing feature.

- [ ] **Step 1: Analyze tab.** Insert `{ id: 'tailor', label: 'Tailored resume', ... }` second in `switcherItems` (after Resume report); `ToolSwitcher` grid becomes `sm:grid-cols-5`. Panel: `<TailorFlow session usage resumeFile={resumeFile} jobDescription={jobDescription} analysisId={...} onUsageChange={setUsage} />` inside `Stage tool="tailor"`. `/api/analyze` does not return the inserted row id today: change its insert to `.insert(...).select('id').single()` and include `analysis_id` in the JSON response (non-blocking failure keeps `analysis_id` undefined).
- [ ] **Step 2: Profile page** `/profile` (redirect to `/login` when signed out, like `/portfolio`): header "Your career profile" + source resume name + "Replace resume" (file input → POST profile, warns first "This replaces edits you made by hand. Confirmed skills are kept."); "Skills you might have" card using `SkillChecklist` with `suggested_skills` (hidden when empty); editable sections (Summary textarea, Skills as comma list, each role/project's bullets as textareas one bullet per line) saved via PATCH `{ data }` with a single "Save changes" button; "Tailor for a job" card containing `TailorFlow` without `resumeFile`; "Your tailored resumes" list from `listTailored` with job title, `before → after`, date, and **Download** (fetch item, render PDF).
- [ ] **Step 3: History.** Fetch `listTailored` alongside analyses; merge by `created_at`; tailored rows show the `TOOLS.tailor` pill "Tailored resume", score `after`, and link to `/profile#tailored-{id}` (profile page scrolls to and highlights that item).
- [ ] **Step 4: End-to-end check on the dev server, signed in with a free test account:**
  1. New account, `/analyze`: run a check, open Tailored resume tab → profile builds → checklist shows → answer one Yes with a note, one No → paste nothing new (JD prefilled) → Tailor → preview, before/after numbers, changes list.
  2. Fill one `[X]`, reload `/profile`: that bullet shows the number.
  3. Download PDF; upload that PDF to `/analyze` with the same JD: sections parse (Skills, Experience present in ATS structure as "good") and the score is within ±10 of the shown "after".
  4. Tailor a second job from `/profile`: zero questions asked; `free_pro_left.tailor` now 0; third attempt shows the locked state.
  5. Upload a different resume on `/analyze`: banner appears once; **Keep my profile** hides it.
  6. History lists both tailored resumes.
- [ ] **Step 5: Run** `npm test` and `npm run build` (stop the dev server first) — Expected: tests pass, build succeeds.
- [ ] **Step 6: Commit** `git commit -m "feat: tailored resume in analyze, profile page and history"`
