# Career profile and one-click tailored resume

Project 1 of 4 in the ResumeMax "done-for-you job hunt" plan. Date: 2026-10-22.

## Why

Today ResumeMax tells people what to fix (missing keywords, weak bullets) and
then leaves them to open Overleaf or Canva and make every change by hand. Most
people won't. This project closes that gap: resume in, job post in, a finished
ATS-ready PDF out.

It is also the base for the rest of the plan. Projects 2–4 (daily job feed,
sending outreach from the user's Gmail, the paid ₹1,499/month job-hunt plan with
reply tracking) all need a saved profile of the person and a way to turn that
profile into a resume for any job without asking them anything.

The owner is relaunching ResumeMax (hardly anyone uses it today) and will build
in public on LinkedIn (2,200 followers) and a new Instagram page. This feature is
the first thing to show: before-and-after resumes and ATS scores are the
headline content.

## Who it's for

Anyone job hunting, not just students: mainly people with 1–10 years of
experience switching jobs, plus freshers. Implications:

- Two-page resumes are normal for experienced people.
- Experience and results matter more than college projects.
- Tone is professional, never "student asking for a chance".

## Goals

1. **Ask once, then one click.** The first time, we build a career profile from
   the uploaded resume and ask one short question. Every tailored resume after
   that needs no input beyond the job post.
2. **Finished PDF.** The output is a downloadable, ATS-ready PDF, not suggestions.
3. **Visible improvement.** Show the ATS score before and after for the same job.
4. **Honest.** Only facts the user's profile backs up go into the resume.

## Non-goals (this project)

- Editing the user's original Canva, Overleaf or Word file.
- Multiple templates or design choices. One template in v1.
- Word (.docx) export.
- Finding jobs, sending emails, or the subscription change (projects 2–4).
- A full resume builder or editor.

## Anti-goals (failure even if it "works")

- **Invented facts:** adding a skill, tool, employer, title, date or number the
  user never gave us. A high score from fake skills is a failure.
- **Keyword stuffing:** hidden or white text, keyword dumps, or bullets that
  read like a list of buzzwords. A recruiter reading it must not wince.
- **Asking questions per job.** If the user has to answer anything for each
  job, we've rebuilt the copy-paste problem.
- **A pretty but unparseable PDF:** columns, tables, icons, images, text as
  outlines. ATS reliability beats looks.

## How it works for the user

### First time: build the profile

1. The user uploads a resume PDF (on the analyze page, or the new profile page).
2. We extract it into a structured career profile (schema below). This is free.
3. One short screen: "Anything else you've worked with?" A checklist of common
   skills for the roles they're targeting that weren't found on the resume, with
   *Yes, I've used it* / *No* buttons and an optional one-line "where" box for
   each Yes. Skippable. This is the only question we ever ask unprompted.
4. The profile is saved. They can review and edit it on a profile page
   (plain text fields per section, no fancy builder).

### Every job after that: one click

1. They paste a job post (on the analyze page after a check, or on the profile
   page) and press **Tailor my resume**.
2. About 15–25 seconds later they see a preview of the tailored resume, the
   score before and after (e.g. 52 → 84), and a short "what changed" list.
3. `[X]` placeholders (numbers only they know) are highlighted in the preview
   and can be filled inline. Download is allowed with unfilled placeholders, but
   we warn first.
4. **Download PDF.**

### Numbers are remembered too

When the user fills an `[X]` placeholder, the number is saved back to the
matching bullet in their profile, so every future tailored resume already has
it. Profile bullets carry stable IDs, and each tailored bullet records the ID it
came from, so fills map back. A number the user typed counts as a profile fact.
*(My call; it follows from "never ask per job".)*

### When they upload a different resume

- On the analyze page, if the user already has a profile and uploads a
  different resume, the Tailored resume tab shows one line: "Update your profile
  from this resume?" with Update / Keep my profile. This comes up only when the
  resume changes, never per job. *(My call.)*
- Updating (here, or "replace the source resume" on `/profile`) rebuilds
  `data` from the new resume. It **keeps** `confirmed_skills`, `declined_skills`,
  `suggested_skills` and `skill_notes`, and carries over filled numbers where the
  same bullet still exists (same company + very similar text). Manual edits to
  other fields are replaced, with a warning before confirming. The one-time
  checklist only reappears if the new resume reveals new skills to suggest.
  *(My call: rebuild-and-carry-over instead of a full merge.)*

### Gaps never interrupt

When a job wants a skill the profile doesn't have:

- If the profile shows the same thing under another name (job says "REST APIs",
  profile says "built a Node.js API"), we use the job's wording. No question.
- Otherwise it is left out of the resume and added to a **Skills you might have**
  list on the profile. The user can tick through that list whenever they like;
  a Yes moves it into the profile for every future resume. A No is remembered so
  we don't suggest it again.

## Tailoring rules

The tailoring step takes the profile + job post and returns a resume in the same
structure, plus a change log. Rules:

- Use only facts in the profile (including confirmed skills and their "where"
  lines). Never add employers, titles, dates, degrees or numbers.
- Rewrite bullets toward the job's language and priorities; keep each bullet
  true to the original. Unknown metrics stay as `[X]`.
- Write a 2–3 line summary aimed at this role.
- Skills section: profile skills only, ordered so the ones the job asks for come
  first; job wording for equivalents.
- Reorder bullets within a role (most relevant first). Roles stay in reverse
  chronological order.
- May drop the least relevant projects or bullets to keep length right. Never
  drop jobs (unexplained gaps hurt).
- Length: one page for under ~3 years of experience, up to two pages otherwise.

## The PDF

- Single column. Standard section headings: Summary, Skills, Experience,
  Projects, Education, plus Certifications if present.
- Contact details at the top as plain text (name, email, phone, city, LinkedIn,
  GitHub/portfolio links).
- Standard font, real selectable text, no tables, columns, icons, photos,
  graphics, headers or footers holding content.
- Dates right-aligned on the same line as the role is fine if it extracts in
  reading order; otherwise put them on the line below.
- Clean enough that a human recruiter finds it good-looking, matching the
  ResumeMax light, minimal style.

## Before-and-after score

- Both scores are computed **from text, by the same scoring helper**, so the
  comparison is like for like. "Before" scores the resume as it was before
  tailoring (the profile rendered as plain resume text). "After" scores the
  tailored resume's text. Same job post, same prompt, same rules (keyword
  coverage 40, experience depth 30, skills alignment 20, quality 10, as in
  `/api/analyze`), adapted to read text instead of an attached PDF.
- We do not store users' original PDFs. The extracted profile is the record of
  the original.
- The same model grading its own output can inflate. Both numbers come from the
  identical prompt, and we never tweak the number in code.
- Scoring here does **not** use up the monthly free checks and does **not**
  create `analyses` rows (history shows the tailored resume instead). Only the
  tailored-resume try is spent. *(My call.)*
- The score shown in the full `/api/analyze` check of the original PDF can
  differ a little from the text-based "before"; the before/after pair is what we
  show for tailoring.

## Where it lives in the app

- **Analyze results:** a new **Tailored resume** tab in the tool switcher, right
  after Resume report. If the user has no profile yet, the tab builds one from
  the resume they just uploaded (with the one-time checklist).
- **New `/profile` page** (in the app nav): view and edit the profile, answer
  "Skills you might have", replace the source resume, and tailor for a new job
  post. Past tailored resumes listed with their job and score, re-downloadable.
- **History:** tailored resumes show alongside checks.
- Uses the existing design system (`components/landing/*`: Stage, Surface, tool
  tints, Loader set). The tool needs its own tint/colour token.

## Access and pricing

- Building and editing the profile: free for signed-in users.
- Tailored resume: a Pro tool with the same **2 free tries** as the other Pro
  tools (added to `PRO_TOOLS` in `lib/plan.js` and tracked in
  `profiles.free_pro_uses`, spent via `use_free_pro()` only after success).
  Unlimited on an active Pro Pass.
- Re-downloading an already generated tailored resume, or filling its
  placeholders, does not spend a try.
- Pricing changes to the ₹1,499/month plan are project 4, not this one.

## Data

Two new Supabase tables (DB changes are made in the Supabase dashboard today;
there are no migration files in the repo). Row-level security: users read and
write only their own rows; API routes use the admin client as the rest of the
app does.

- `career_profiles`: one row per user. `user_id` (pk), `data` (jsonb, schema
  below), `confirmed_skills` (text[]), `declined_skills` (text[]),
  `suggested_skills` (text[], the "Skills you might have" list),
  `source_resume_name`, `created_at`, `updated_at`.
- `tailored_resumes`: `id`, `user_id`, `analysis_id` (nullable),
  `job_title`, `company`, `jd_text`, `resume` (jsonb, same schema as profile
  data), `changes` (jsonb), `score_before`, `score_after`, `created_at`.

Profile `data` shape:

```
{
  contact: { name, email, phone, location, links: [{ label, url }] },
  summary,
  experience: [{ id, company, title, location, start, end, current, bullets: [{ id, text }] }],
  projects:   [{ id, name, link, tech: [], bullets: [{ id, text }] }],
  education:  [{ school, degree, field, start, end, grade }],
  skills: [],
  certifications: [{ name, issuer, year }],
  extras: []   // anything else worth keeping (awards, languages)
}
```

Each confirmed skill can carry an optional evidence line:
`confirmed_skills` stores names; the "where" lines live in `data.skill_notes`
as `{ skill: text }`.

## Constraints

- Same AI provider as the rest of the app: Gemini 2.5 Flash via REST, with the
  resume PDF sent inline so Canva/vector PDFs still read.
- Next.js 14 App Router, plain JS (no TypeScript), Supabase, Vercel serverless.
  Anything heavy (headless Chrome) is a poor fit for Vercel functions.
- `jspdf` is already a dependency (used for cover letter export).
- Server time limits: `/api/analyze` already takes ~15–25 s per call in
  production with no `maxDuration` set, so one Gemini call per request is known
  to fit. Split the work into separate requests (extract profile; tailor; score
  before + after) driven by the client rather than chaining several Gemini calls
  in one function, and set `maxDuration` on new routes. Show the Loader progress
  UI meanwhile.
- Free monthly check limits and Pro access checks follow the existing patterns
  in `/api/analyze` and `lib/plan.js`.

## Decided by the owner

- Fresh standard layout chosen for the highest ATS score, not the user's own design.
- Never add skills the user hasn't confirmed; ask once, remember forever, and
  never ask per job.
- Audience is all job seekers, mainly working professionals.
- This project first; job feed, sending, and the paid plan follow.

## Calls I made (owner can overrule)

- One template; single column; one page under ~3 years' experience, else up to two.
- Profile building free; tailored resume uses the 2-free-tries Pro model until
  project 4 changes pricing.
- The one-time "anything else you've worked with?" checklist at profile setup.
- Inline filling of `[X]` placeholders before download.
- New `/profile` page plus a tab in the analyze results.
- Before/after both scored from text by one helper; no stored PDFs; tailoring
  doesn't use monthly checks or add `analyses` rows.
- Filled `[X]` numbers saved back to the profile via bullet IDs.
- A different upload prompts "Update your profile from this resume?" once;
  updating rebuilds the profile but keeps confirmed/declined skills and notes.
- Work split across client-driven requests to stay inside function time limits.

## Left to the builder

- PDF rendering approach (client-side jsPDF vs a server-side library), as long
  as the output meets "The PDF" rules and extracts cleanly. Verify by running the
  generated PDF back through `/api/analyze`: it should parse into the same
  sections and score in the same range as the "after" score.
- Exact prompts, JSON validation and retry behaviour for extraction and
  tailoring.
- How the target-role skill checklist is generated (model call vs a static list
  per role).
- Component structure, file names, API route shapes.
- Tool colour token for "Tailored resume".

## Success looks like

- First-time user: upload to downloaded PDF in under ~90 seconds including the
  checklist. Returning user: job post to PDF in under ~30 seconds, zero questions.
- The tailored PDF, uploaded back into ResumeMax, parses into the same sections
  and scores higher than the original for that job.
- No tailored resume contains a skill, employer, title, date or number that
  isn't in the profile.
