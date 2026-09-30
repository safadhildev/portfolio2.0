# Blueprint: "My Resume" (ATS PDF + open counter + `visible` flag)

Status: v1 (indie-sa) | Input: owner brief (verbatim in task) | Date: 2026-09-30 | Branch: `dev`
Stack (verified): Next 15.5.26 App Router, React 19.3, TS 5.7 strict, Tailwind v4 (`@theme` in app/globals.css),
AOS, static JSON, `node:test` via Node 22.22 type-stripping, `@vercel/analytics` 2.x. No zod, no DB.

## 0. Verification findings (code/JSON state on the dirty `dev` tree)

| # | Finding | Evidence |
|---|---------|----------|
| V1 | **`next build` is broken right now.** `pickSections` throws `sections[0].type: unknown section type "details"`. `qualification` is also unknown. `SECTION_TYPES` has 7 members, the JSON has 9 types. | lib/content-schema.ts:3-11, reproduced with node |
| V2 | `npm run typecheck` fails. page.tsx passes `skills` to AboutSection, whose props no longer accept it. | app/page.tsx:39 |
| V3 | `npm test`: 30/31. The badge test expects "2025" (end rule). `EXPERIENCE_CONFIG.badgeRule` is `"start"` (2023). Owner must pick one: fix the test or the config. | lib/experience.test.ts:166, lib/experience.ts:11 |
| V4 | Leftover debug logs ship to prod: `console.log("[DEBUG]…")`. | lib/experience.ts:186, ExperienceSection.tsx:10, ExperienceCard.tsx:61 |
| V5 | `javascript.svg` was deleted and `js.svg` added. JSON `skills[].icon: "javascript"` and `TECH_EXTRAS.javascript.icon` still point to it: 404 `<Image>` in SkillChip on mobile, text fallback in Experience. | git status, lib/experience.ts:43 |
| V6 | `visible` exists **only at section level**, on all 9 sections: details **false**, hero true, about true, skills true, experience true, education **false**, qualification **false**, projects true, contact true. No item has it and no code reads it. | content/portfolio.json |
| V7 | `details` has no `sectionName`/title. It uses a kebab key `portfolio-link`. `details.email` = safadhil95@… but `contact.email` = safadhildev@…. | JSON |
| V8 | `qualification.content` has 8 strings. 2 are continuation fragments of the previous line ("(2018) by Faculty…", "(InIIC Series 1/2020) – …"). It has no `sectionTitleStyles`, and 2 items duplicate `education.details`. | JSON |
| V9 | `education` is in SECTION_TYPES but has no type, validator or website component. The "Data Analyst with Python Track" entry is a 1-day DataCamp course. | lib/content.ts, JSON |
| V10 | `public/icons/external-link.svg` already exists: 18×18, stroke `#F0EDE0` (cream). `Icon color="#151515"` recolours it (stroke path). It is a box-arrow glyph. The brief says "↗", so the Figma glyph must be confirmed. | public/icons, components/ui/Icon.tsx:35 |
| V11 | `app/page.tsx` is `"use client"` and imports the whole JSON, so **hidden sections ship in the client bundle**. `visible:false` is a display flag, **not** a privacy control. | app/page.tsx:1,14 |
| V12 | `yarn.lock` is **tracked** (committed in 7e2f70a), not untracked as the brief says. Both lockfiles are committed. | `git ls-files` |
| V13 | Section numbers are hardcoded 1–5 in page.tsx. `sectionNumber` was removed from the validator. `showExperience` = `content.length > 0` only. | app/page.tsx:19,40-52 |
| V14 | Experience header (ExperienceSection.tsx:73-91) is a single `flex-col`. The subtitle `<p>` switches copy at `md` (`$ experience --timeline` / `{n} entries • verified`). | file |
| V15 | Vercel Web Analytics custom events (`track()`) are **Pro/Enterprise only**. `@react-pdf/renderer` 4.x has open issues rendering inside Next 15 App Router route handlers (#3074, #2994). No `pdftotext`/`qpdf` locally. | vercel docs, GitHub |

## 0b. Assumptions (defaults adopted; each is a one-line override)

| # | Default | Override location |
|---|---------|-------------------|
| A1 | The whole button is the link. "Pressing the icon" is read as pressing the button. | ResumeButton |
| A2 | Open inline in a new tab. The browser's viewer/Save handles saving. No forced download. | next.config `headers()` |
| A3 | A "press" = a non-bot GET of `/resume` on Production. Headline number = **unique visitors/day**. | lib/resume-counter.ts |
| A4 | `visible` is **required boolean at section level**. Items have no `visible` (not in JSON today). | content-schema |
| A5 | Resume order: Header → Experience → Education → Skills → Qualifications. Headings: "Experience", "Education", "Skills", "Qualifications". | `RESUME_CONFIG.sections` |
| A6 | Contact line prints `details.location`, `details.email`, `details.portfolio-link`. No phone (none in JSON). | `RESUME_CONFIG` + JSON |
| A7 | Experience `description` is not printed (same as the website). `responsibilities` become bullets and `skills` become a "Tech:" line. | `RESUME_CONFIG.showDescription` |
| A8 | Skills = the Skills section grouped by label prefix, plus a "Tools & Technologies" group of deduped Experience tech labels. | `RESUME_CONFIG.includeExperienceTech` |
| A9 | A4 page, single column, Inter Regular/Bold embedded (OFL). Expected about 2 pages. | lib/resume-pdf.ts constants |
| A10 | Public filename `Syed-Ahmad-Fadhil-Resume.pdf`. The PDF and `/resume` are `noindex`. | `RESUME_FILE`, headers |
| A11 | If Experience is hidden, the button is hidden too (it lives only in that header). | Q4 |

## 1. Summary
Add a "My Resume ↗" link-button to the Experience header. It opens `/resume` in a new tab. `/resume` is a tiny Node
route handler: it records the open **after** responding (`after()`), then 307-redirects to a **static, build-time
generated** `/Syed-Ahmad-Fadhil-Resume.pdf`. The PDF is produced by `scripts/build-resume.ts` (npm `prebuild`) from
`content/portfolio.json` with **pdfkit**. It uses only the details/experience/education/qualification/skills sections, ignores `visible`,
and is single-column, tagged, with embedded fonts. In parallel, the loader validates all 9 section types (fixes V1), makes `visible`
a required section flag, and adds one pure `filterVisible()` that only the website uses to gate sections, nav, sidebar and numbering.
The count is stored in Upstash Redis (Vercel Marketplace, free tier). Scope: this Next app only.

## 2. Decisions
- **D1 PDF strategy = build-time static file (pdfkit, Node script in `prebuild`).** Rejected: *route-handler generation*
  (cold start + font I/O on every press, and the react-pdf/Next 15 reconciler breakage in V15), *print-CSS page*
  (not a file, output varies by browser, the page would break ATS rules), *client-side* (ships a PDF lib to every visitor, text layer varies).
  Build-time output is identical for everyone, CDN-cached, zero runtime risk, and regenerated on every deploy from the one JSON.
- **D2 Library = `pdfkit@^0.20` (devDependency).** It has real text flow with wrapping and pagination, embeds and subsets TTF with ToUnicode maps
  (clean extraction), `info` metadata, `lang`, and tagged-PDF (`tagged: true`, structure elements). It has no React reconciler,
  so it cannot break on React 19. Rejected: `@react-pdf/renderer` (V15, and cannot tag), `pdf-lib` (no line wrapping or layout).
  Types: `@types/pdfkit` (dev). The script runs outside webpack, so pdfkit's AFM/`fs` bundling issue does not apply.
- **D3 Fonts: Inter Regular + Bold static TTF** (SIL OFL 1.1) committed to `assets/fonts/` with `OFL.txt`. Standard-14 fonts are
  not embedded, and `next/font` files are not reachable from a script. Disable ligatures (`features: ["kern"]`) so "fi"/"fl" extract as
  two letters. Space Grotesk (brand, OFL) is a one-line override.
- **D4 One parser, two consumers.** Move the loader body into a pure `parsePortfolio(raw)` in lib/content-schema.ts. lib/content.ts
  (website) and the script/tests all call it. The resume never calls `filterVisible`, which is how "resume ignores visible" is enforced.
- **D5 Counting on the server, at `/resume`, not by an onClick beacon.** It works without JS, counts direct/shared links too, and refreshing the PDF
  tab hits the static URL, so it is **not** re-counted. Bots are filtered with `userAgent(req).isBot` and empty UA. `HEAD` and
  `Sec-Purpose`/`Purpose: prefetch` are skipped. Uniques are deduped with `SET NX EX 90000` on `sha256(salt|ip|ua|UTC-day)`. The IP is never stored.
  Only `VERCEL_ENV === "production"` counts. `after()` (stable in Next ≥15.1) runs the write after the 307 is sent, and every
  error is caught and logged, so **tracking can never block or fail the redirect**. Missing env means skip and warn once.
- **D6 Store = Upstash Redis via Vercel Marketplace.** The free tier (about 500k commands/month) is far above need. It uses 3 keys, has no schema, and adds 1 runtime dep
  (`@upstash/redis`, only imported by the route). Rejected: Vercel Analytics custom events (Pro-only, V15), Blob (no atomic
  increment, so racy), Global Config (not write-heavy), Neon Postgres (schema and pool for one integer). There is no cookie or PII, so no consent banner is needed.
- **D7 Owner reads the number** in the Upstash console Data Browser (`resume:opens:unique`, `resume:opens:daily`) or with one `curl`
  (§4.5). No stats endpoint means no new auth surface.
- **D8 `visible` semantics:** a required `boolean` on every section, validated at build, so a missing flag **fails the build**. That sidesteps the
  default question and honours "only `visible: true` is shown" without silently hiding a section. The item-level flag is deferred (Q2).
- **D9 Package manager = npm.** `package-lock.json` is the older, primary lock (prior blueprint). Delete `yarn.lock` in its own
  commit **before** adding deps. With both present, Vercel may pick yarn: npm-added deps would be missing from yarn.lock, and
  Yarn Berry does not run `prebuild`, which would silently skip PDF generation.
- **D10 Link semantics:** a plain `<a>` (not `next/link`, to avoid prefetch) with `target="_blank" rel="noopener noreferrer nofollow"`,
  visible text "My Resume" plus `sr-only` "(PDF, opens in a new tab)". The icon is decorative (`alt=""`).

## 3. Compatibility & risks
- Stack fit: no new framework or CSS system. New deps: `@upstash/redis` (dep), `pdfkit`, `@types/pdfkit`, `unpdf` (dev, test-only
  text extraction). Install with **npm** only after D9. Reuse `.btn-press`, `Icon`, Tailwind tokens.
- Node: `prebuild` runs `node scripts/build-resume.ts` with type-stripping (needs Node ≥22.18). Set the Vercel project Node to 22.x
  and add `"engines": {"node": ">=22.18"}`. Runtime relative imports in modules the script uses **must use `.ts` extensions**
  (as the tests already do). Type-only imports may stay extensionless.
- Generated file: `public/Syed-Ahmad-Fadhil-Resume.pdf` goes in `.gitignore` (single source of truth). Also run the script in `predev`.
- Lint/CI: `scripts/*.ts` is covered by eslint/tsc (`include: **/*.ts`). No new `.cjs`. `npm run build` must pass lint as today.
- Closed unions needing exhaustive `switch` + `assertNever` + one test per member: `SectionType` (9),
  `ResumeSection["kind"]` (4), `ResumeRequestKind` (4), `SkillGroupKey` (4).
- Security: timing-safe comparison is not applicable (no secrets compared). The salt and Redis token live only in env. The route reads no body.
  `x-forwarded-for` is used only as a hash input. Redirect target is a constant (no open redirect).
- Counter abuse: total opens can be inflated by a script. **Uniques** are capped at 1 per visitor/day. Optional Vercel Firewall rate-limit
  rule on `/resume` (owner, dashboard). Preview deployments do not count.
- Platform parity: desktop Chrome/Firefox/Safari and iOS Safari render the PDF inline and Save/Share works. **Android Chrome has no
  inline viewer**: it downloads the file and the new tab may close. In-app browsers (LinkedIn/Instagram) may ignore `_blank`.
  All of these are acceptable. QA checks them.
- ATS: selectable text, single column, no tables/images/icons in the text flow, standard headings, reading order = draw order,
  metadata Title/Author/Subject/Keywords, `lang: "en"`, `displayTitle: true`, tagged. Avoid headers/footers (no page numbers).
- Privacy (flag): the resume publishes `details.email` (safadhil95@…, V7). Hidden sections are already public in the JS bundle (V11).
- Font licensing: OFL permits embedding and subsetting. Commit `OFL.txt` next to the TTFs.
- Pre-existing blockers V1–V5 must be fixed first (slice S0). V1 is inside this feature's scope because the loader changes anyway.

### 3.1 Figma pull list (indie-fe; fileKey `nWSm8ciH48pT40hzECT2KV`, page "Finished")
| Step | Node | Tool | Extract |
|------|------|------|---------|
| F1 | 76:1087, 76:1329 | get_metadata | ids of the Experience header row and the Resume button + icon instance |
| F2 | same | get_screenshot | reference for alignment (desktop right/bottom, mobile below subtitle) |
| F3 | button node (both) | get_design_context | TBD values below |
| F4 | icon node | download_assets | the "↗" glyph. If it differs from `external-link.svg`, save as `public/icons/arrow-up-right.svg` with stroke `#151515` |

**TBD-from-Figma (do not guess):** button height, padding-x, gap, border width/colour/radius, shadow offset/colour, bg
(white `#FFFFFF` vs cream `#FFFDFC`), font size/weight/family, icon glyph and size, desktop header-row gap to button, mobile
spacing subtitle→button, whether the label has "↗" as text or icon only. Fallback if Figma is unavailable: hero LinkedIn button
metrics (`h-[42px] px-4 gap-1.5 rounded-md border-2 border-ink text-[13px] font-mono font-bold btn-press`).

## 4. Contracts

### 4.1 JSON (content/portfolio.json)
Every section: `"type": SectionType`, `"visible": boolean` (required). New/confirmed shapes:
```jsonc
{ "type": "details", "visible": false,
  "content": { "name": "…", "position": "…", "email": "…", "location": "…", "portfolio-link": "https://…" } } // all required non-empty
{ "type": "education", "visible": false, "sectionName": "…", "sectionTitle": "…", "sectionTitleStyles": {…}?,   // styles optional
  "content": [ { "start": ISO, "end": ISO|null, "title": "…", "subtitle": "…", "details": ["…"] } ] }
{ "type": "qualification", "visible": false, "sectionName": "…", "sectionTitle": "…", "content": ["…"] }
```

### 4.2 Types (lib/content.ts)
```ts
export type SectionType = "details"|"hero"|"about"|"skills"|"experience"|"education"|"qualification"|"projects"|"contact";
// every existing *Content interface gains  visible: boolean
export interface DetailsContent { type: "details"; visible: boolean;
  content: { name: string; position: string; email: string; location: string; portfolioLink: string } } // from "portfolio-link"
export interface EducationEntry { start: string; end: string | null; title: string; subtitle: string; details: string[] }
export interface EducationContent { type: "education"; visible: boolean; sectionName: string; sectionTitle: string;
  sectionTitleStyles?: TextStyle; content: EducationEntry[] }
export interface QualificationContent { type: "qualification"; visible: boolean; sectionName: string; sectionTitle: string; content: string[] }
export interface PortfolioContent { title: string; details: DetailsContent; hero: HeroContent; about: AboutContent;
  skills: SkillsContent; experience: ExperienceContent; education: EducationContent; qualification: QualificationContent;
  projects: ProjectsContent; contact: ContactContent }
```

### 4.3 lib/content-schema.ts (pure)
```ts
export const SECTION_TYPES: readonly SectionType[];              // 9 members, array order = JSON-agnostic
export function parsePortfolio(raw: unknown): PortfolioContent;  // pickSections + every validator; throws "path: reason"
export function validateDetails(raw: unknown): DetailsContent;
export function validateEducation(raw: unknown): EducationContent;       // same ISO/start<=end rules as experience
export function validateQualification(raw: unknown): QualificationContent; // non-empty strings
export function validateSkills(raw: unknown): SkillsContent;             // replaces the `as` cast; resume depends on it
function readVisible(raw, path): boolean;                                // typeof !== "boolean" -> throw
```
Hero/about/projects/contact keep presence+type checks plus `readVisible` (no deep-validation creep).

### 4.4 lib/visibility.ts (pure, website only)
```ts
export function filterVisible<T extends { visible: boolean }>(items: readonly T[]): T[];       // keeps visible === true
export function visibleSectionTypes(c: PortfolioContent): ReadonlySet<SectionType>;          // via filterVisible over the 9 sections
export function numberSections(order: readonly SectionType[], visible: ReadonlySet<SectionType>): Partial<Record<SectionType, number>>;
// WEBSITE_ORDER = ["about","skills","experience","projects","contact"] -> visible ones numbered 1..n, no gaps
```
page.tsx: render a section only if it is in the set (About+Skills `BoxView` only if either is visible). `showExperience =
set.has("experience") && experience.content.length > 0`. Nav/Sidebar replace `showExperience` with
`visibleHrefs: ReadonlySet<string>` built from `SECTION_HREF` ↔ type map in constants.tsx. Hidden sections are not rendered, so
SectionHashSync never observes them (no change there). `#skills`/details/education/qualification have no nav entries.

### 4.5 Resume model: lib/resume.ts (pure; imports `./experience.ts`, `./content-schema.ts`)
```ts
export const RESUME_FILE = "Syed-Ahmad-Fadhil-Resume.pdf"; export const RESUME_ROUTE = "/resume";
export type SkillGroupKey = "languages" | "frameworks" | "cloud" | "tools";
export type ResumeSection =
  | { kind: "experience"; heading: string; items: { title: string; org: string; dateRange: string; bullets: string[]; tech: string[] }[] }
  | { kind: "education"; heading: string; items: { title: string; org: string; dateRange: string; bullets: string[] }[] }
  | { kind: "skills"; heading: string; groups: { key: SkillGroupKey; label: string; items: string[] }[] }
  | { kind: "qualification"; heading: string; bullets: string[] };
export interface ResumeModel {
  meta: { title: string; author: string; subject: string; keywords: string[] };  // "<name> — Resume", name, position, skill labels
  header: { name: string; headline: string; contact: string[] };                   // [location, email, portfolioLink]
  sections: ResumeSection[];                                                        // config order; empty sections omitted
}
export function buildResumeModel(c: PortfolioContent): ResumeModel;               // NEVER filters by visible
```
Mapping rules:
| Source | Output |
|--------|--------|
| details | name, headline = position, contact = [location, email, portfolioLink]. portfolioLink printed without `https://` and also added as a link annotation |
| experience | `sortExperience` (reuse), `title`, `org = company`, `dateRange = formatDateRange(start,end)`, bullets = responsibilities, tech = `resolveTech(slug, skills, new Set()).label` deduped |
| education | sort with the same comparator (generalise `sortExperience` to `<T extends {start:string; end:string\|null}>`, non-breaking), title, org = subtitle, dateRange, bullets = details |
| qualification | bullets = content verbatim (fragments are **not** auto-merged; see Q5) |
| skills | label prefix → group: `language.*`→languages "Languages"; `mobile.*`/`platform.*`/`runtime.*`/`framework.*`→frameworks "Frameworks & Platforms"; `cloud.*`→cloud "Cloud & Services"; unknown prefix→tools. "tools" also gets experience tech labels not already listed (A8). Empty groups dropped |
Date formatting: add `formatDateRange(start, end): string` to **lib/experience.ts** (`"Aug 2023 - Present"`, reusing
`formatMonthYear` + `EXPERIENCE_CONFIG.presentLabel`). Do not add a second date helper.

### 4.6 PDF writer: lib/resume-pdf.ts + scripts/build-resume.ts
```ts
export function renderResumePdf(m: ResumeModel, o: { fontDir: string; creationDate: Date }): Promise<Buffer>;
// pdfkit: size "A4", margins 50pt, tagged: true, lang: "en", displayTitle: true, pdfVersion: "1.7",
// info {Title, Author, Subject, Keywords, Creator: "portfolio2.0", CreationDate}; fonts Inter-Regular/Bold; features ["kern"].
// Layout: name 20pt bold; headline 11pt; contact 9.5pt joined " | "; heading 11.5pt bold UPPERCASE + 0.75pt rule;
// entry: "Title" bold 10.5pt, next line "Org | dateRange" 10pt; bullets via doc.list (vector bullets) 10pt; "Tech: a, b" 9.5pt.
// Keep-together: move an entry to the next page if its title+first bullet would not fit. Colours: black text only.
```
`scripts/build-resume.ts`: read the JSON with `fs` → `parsePortfolio` → `buildResumeModel` → `renderResumePdf` → write
`public/${RESUME_FILE}`. Log the byte size and page count. Exit 1 on any throw (fails the Vercel build loudly).

### 4.7 Counter: lib/resume-counter.ts (pure) + app/resume/route.ts
```ts
export type ResumeRequestKind = "count" | "head" | "prefetch" | "bot";
export function classifyResumeRequest(i: { method: string; userAgent: string; isBot: boolean;
  secPurpose: string | null; purpose: string | null }): ResumeRequestKind;
export function utcDay(now: Date): string;                                          // "2026-09-30"
export function visitorHash(salt: string, ip: string, ua: string, day: string): string; // sha256 hex (node:crypto)
export interface CounterStore {                                                      // subset of @upstash/redis Redis
  set(k: string, v: string, o: { nx: true; ex: number }): Promise<"OK" | null>;
  incr(k: string): Promise<number>; hincrby(k: string, f: string, n: number): Promise<number>; }
export function recordResumeOpen(s: CounterStore, i: { hash: string; day: string }): Promise<void>;
// always INCR resume:opens:total; if SET resume:seen:<hash> NX EX 90000 == "OK": INCR resume:opens:unique + HINCRBY resume:opens:daily <day> 1
```
Route (`runtime = "nodejs"`, `dynamic = "force-dynamic"`): `GET` returns `307 Location: /${RESUME_FILE}` with
`Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`. If kind === "count", `VERCEL_ENV === "production"`, and env is present,
it calls `after(() => recordResumeOpen(redis, …).catch(logOnce))`. `HEAD` gets the same redirect and is never counted.
Env: `KV_REST_API_URL` + `KV_REST_API_TOKEN` (Marketplace-injected names; also accept `UPSTASH_REDIS_REST_URL/_TOKEN`), `RESUME_COUNTER_SALT`.
next.config `headers()`: `/${RESUME_FILE}` → `Content-Disposition: inline; filename="Syed-Ahmad-Fadhil-Resume.pdf"`,
`X-Robots-Tag: noindex`. Owner read: `curl "$KV_REST_API_URL/get/resume:opens:unique" -H "Authorization: Bearer $KV_REST_API_READ_ONLY_TOKEN"`.

### 4.8 UI: components/ui/ResumeButton.tsx (server-safe, no `"use client"`)
```tsx
ResumeButton({ className?: string })
// <a href={RESUME_ROUTE} target="_blank" rel="noopener noreferrer nofollow"
//    className="btn-press inline-flex h-[42px] items-center gap-1.5 self-start rounded-md border-2 border-ink bg-white px-4
//               font-mono text-[13px] font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-4
//               focus-visible:outline-ink md:self-auto">
//   My Resume <Icon name="external-link" color="#151515" size={16} alt="" /> <span className="sr-only">(PDF, opens in a new tab)</span></a>
```
ExperienceSection header (lines 73-91): wrap in `flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6`.
The left column is the existing label/h2/subtitle block (unchanged). The right column is `<ResumeButton className="md:shrink-0" />`.
- `<md`: stacks under the subtitle, left-aligned (`self-start`). Spacing TBD-from-Figma (default `gap-4`).
- `≥md`: same row, `items-end`, so the button bottom aligns with the subtitle baseline box. It is the last flex child, so it sits right.
- Verify at 768/1024 that a long h2 plus the button does not overflow (the h2 column gets `min-w-0`).
Touch target 42px high (≥44 recommended, so TBD-from-Figma; bump to `h-11` if Figma allows). Contrast: ink on white is 18:1. The hover/active
states come from `.btn-press` (lift / press). The focus ring is visible on both the cream page bg and the white button.

## 5. Reuse map
| Existing | Path | Use |
|----------|------|-----|
| `pickSections`, `readString/readIso/readStringArray/readTextStyle` | lib/content-schema.ts | Extend for 9 types, reuse for new validators |
| `sortExperience`, `formatMonthYear`, `resolveTech`, `EXPERIENCE_CONFIG`, `assertNever` | lib/experience.ts | Resume ordering, dates, tech labels (generalise sort signature only) |
| `.btn-press`, hero LinkedIn button classes | app/globals.css:29-47, HomeSection.tsx | Button style |
| `Icon` (stroke recolour) + `external-link.svg` | components/ui/Icon.tsx, public/icons | Button icon |
| `SECTION_HREF`/`NAV_LINKS` | components/constants.tsx | Visibility → nav/sidebar filtering |
| `node:test` setup, `.ts` import style | lib/*.test.ts, package.json `test` | All new unit tests |
**Do not rebuild:** a date formatter, a section picker, a second JSON loader, a button style, an icon pipeline, an analytics SDK.
Do not add zod, react-pdf, Playwright/Chromium, or a stats endpoint.

## 6. Implementation map
| Slice | Files (N new / M modified / D deleted) | Owner |
|-------|----------------------------------------|-------|
| S0 Unblock tree (V1–V5) | app/page.tsx (M: AboutSection props), lib/experience.ts (M: remove log; badgeRule per Q7), components/sections/ExperienceSection.tsx, ExperienceCard.tsx (M: remove logs), content/portfolio.json + lib/experience.ts (M: `javascript`→`js` slug or rename svg, Q8), yarn.lock (D) | indie-fe |
| S1 Content contract | lib/content.ts (M: types, `parsePortfolio` call), lib/content-schema.ts (M: 9 types, validators, `readVisible`, `parsePortfolio`) | indie-fe |
| S2 Visibility | lib/visibility.ts (N), app/page.tsx (M), components/constants.tsx (M), components/layout/IdeNavigation.tsx (M), FileExplorerSidebar.tsx (M) | indie-fe |
| S3 Resume model + PDF | lib/experience.ts (M: `formatDateRange`, generic sort), lib/resume.ts (N), lib/resume-pdf.ts (N), scripts/build-resume.ts (N), assets/fonts/Inter-Regular.ttf, Inter-Bold.ttf, OFL.txt (N), package.json (M: prebuild/predev/resume scripts, engines, deps), package-lock.json (M), .gitignore (M) | indie-be |
| S4 Counter | lib/resume-counter.ts (N), app/resume/route.ts (N), next.config.ts (M: `headers()`), .env.example (N: names only) | indie-be |
| S5 Button | components/ui/ResumeButton.tsx (N), components/sections/ExperienceSection.tsx (M), public/icons/arrow-up-right.svg (N, only if F4 differs) | indie-fe |
| S6 Tests | lib/content-schema.test.ts (M), lib/visibility.test.ts (N), lib/resume.test.ts (N), lib/resume-pdf.test.ts (N), lib/resume-counter.test.ts (N), lib/experience.test.ts (M) | indie-qa |
| S7 Docs | PLAN.md (M: 9 types + `visible`, resume pipeline, counter, env, lockfile, privacy note V11) | indie-fe |
| S8 Review | none (findings) | indie-review |

## 7. Build sequence
Prerequisite: owner answers Q1–Q8 (defaults apply if silent), checkpoint-commits the dirty tree, approves `git rm yarn.lock`.
1. [ ] **S0** unblock. Gate: `npm run typecheck && npm test` green, and `npm run build` fails only on V1.
2. [ ] **S1** contract. Gate: `npm run build` green, page unchanged visually.
3. [ ] **S6-red** indie-qa writes tests from §4.3–4.7 (they fail). Then **S2** ∥ **S3** ∥ **S4** (independent; S3/S4 share only `RESUME_FILE`/`RESUME_ROUTE` from lib/resume.ts, so land that constant first).
4. [ ] **S5** button (needs S4 route path, F1–F4 values).
5. [ ] Owner Marketplace step (below). Then a preview deploy to check the redirect and PDF. Counting is verified on production only.
6. [ ] **S7** docs, then indie-qa full matrix, then **S8** indie-review, then fixes, then indie-qa re-run.

**Owner Marketplace step (do not automate):** Vercel dashboard → project → Storage → Marketplace → *Upstash for Redis* →
Free plan, region near `sin1` → Connect to project (Production; Preview optional). Then `vercel env add RESUME_COUNTER_SALT production`
(value: `openssl rand -hex 32`) → `vercel env pull .env.local` for local dev → confirm names with `vercel env ls`.
Optional: Firewall → rate-limit rule `/resume`, 20 req/min/IP.

## 8. Acceptance criteria
Commands (all green): `npm run typecheck`, `npm run lint`, `npm test`, `TZ=UTC npm test`, `npm run build` (log shows
"resume: N bytes, P pages"), `ls public/Syed-Ahmad-Fadhil-Resume.pdf`.
Unit (`node:test`, one case per union member):
- [ ] `pickSections`/`parsePortfolio`: each of the 9 `SectionType`s resolves. Missing, duplicate, unknown each throw. A missing or non-boolean `visible` throws with its path. The real portfolio.json parses.
- [ ] `validateDetails/Education/Qualification/Skills`: one failing field each, with a path message. `portfolio-link` maps to `portfolioLink`.
- [ ] `filterVisible` keeps only `true`. `visibleSectionTypes` on the real JSON = {hero, about, skills, experience, projects, contact}. `numberSections` has no gaps when experience is hidden (projects = 3).
- [ ] `buildResumeModel` on a fixture where **every section has `visible:false`** still returns details plus 4 sections (resume ignores visible). Section order = config. An empty section is omitted. Experience newest-first. `dateRange` = "Oct 2025 - Present" / "Aug 2023 - Oct 2025". Each `ResumeSection.kind` and each `SkillGroupKey` is produced at least once. Hero/about/projects/contact text never appears.
- [ ] `renderResumePdf` → `unpdf.extractText`: contains the name, then headings in order EXPERIENCE < EDUCATION < SKILLS < QUALIFICATIONS. Every responsibility sentence is present verbatim. "Firebase" and "profile"-style ligature words are intact. No `�`. Curly `’` and `–` survive. Metadata Title = "Syed Ahmad Fadhil Bin Syed Hassan — Resume". Page count ≤ 3.
- [ ] `classifyResumeRequest`: one case each for count, head, prefetch (both headers), bot (isBot and empty UA). `recordResumeOpen` with a fake store: first hit gives total 1 / unique 1 / daily 1. Same hash again gives total 2 / unique 1. A store that throws is caught by the route wrapper (the route test asserts the 307 is still returned; use an injected store factory).
Manual (indie-qa; desktop Chrome/Safari/Firefox, iOS Safari, Android Chrome, one in-app browser):
- [ ] Desktop 1440 and 1024: button right of the header, bottom aligned with "3 entries • verified". Mobile 390/320: under "$ experience --timeline", left-aligned, no overflow. Compare with Figma 76:1087/76:1329.
- [ ] Click opens a new tab showing the PDF. The original tab stays. Save gives `Syed-Ahmad-Fadhil-Resume.pdf`. Android downloads it (expected).
- [ ] In a PDF viewer, Select-All + copy + paste into a plain editor gives single-column, correct reading order, with no stray bullets or icons. Document title shows in the tab.
- [ ] On production, 1 click adds 1 to total and 1 to unique. A 2nd click the same day adds only to total. Refreshing the PDF tab adds nothing. `curl -I /resume` adds nothing. Preview deploy adds nothing. With Redis env removed, the PDF still opens (no 5xx).
- [ ] Toggle `experience.visible:false`: section, nav link, sidebar item and button disappear, and Projects becomes 03. The resume still contains Experience.
- [ ] a11y: Tab reaches the button with a visible ring. VoiceOver reads "My Resume (PDF, opens in a new tab), link". axe shows 0 new violations. Reduced motion shows the button immediately.

## 9. Out of scope
Branch `dev`; commit only when the owner asks. Out of scope: website components for education/qualification/details, item-level `visible`,
an `about`/summary block in the resume, a stats page or endpoint, analytics custom events, i18n (site has none), editing
resume content (JSON is owner-authored; indie agents do not rewrite V8 fragments), removing `gsap`/`particles-bg`,
restyling other sections. Do not reformat unrelated dirty files.

## 10. Ambiguities flagged (not silently chosen)
- "Pressing the icon" vs the whole button → A1. "Open new tab" vs "able to save/download" → A2 (inline plus the viewer's Save, not forced download).
- "Items with visible: true" → the JSON only has section-level flags (V6). Item-level is deferred (Q2).
- `visible` on details/education/qualification has no website effect: there are no components, so flipping to true shows nothing (Q3).
- "Press / download" count → counts `/resume` opens, not button renders or completed downloads (browsers do not report saves).
- The resume includes `skills` but not `about`, so there is no summary paragraph (Q6).

## 11. Open questions for the owner (default applies if unanswered)
| # | Question | Default |
|---|----------|---------|
| Q1 | Which email goes on the resume: `details.email` (safadhil95@) or `contact.email` (safadhildev@)? | details.email as written |
| Q2 | Item-level `visible` (per experience/project/skill)? If yes, missing = shown or hidden? | Not now. If added later: missing = hidden (strict to your wording), and validator requires it |
| Q3 | Should `visible:true` on education/qualification add website sections? | No (separate feature) |
| Q4 | If Experience is hidden, where should the Resume button go? | Hidden with the section |
| Q5 | Merge the 2 split qualification lines and drop duplicates of education details? | You edit JSON. Printed verbatim until then |
| Q6 | Add a LinkedIn URL / phone to `details`, and a summary to the resume? | LinkedIn: add `details.linkedin` (optional field, printed if present). No phone, no summary |
| Q7 | Badge rule: fix the config (`"end"`) or the test (`"start"`)? (V3) | Config back to `"end"` (prior blueprint A2) |
| Q8 | JavaScript icon: rename `js.svg` back to `javascript.svg`, or change slugs to `js`? (V5) | Change the icon fields to `js` (keep the new file) |
| Q9 | Should the PDF be indexable by search engines? | No (`noindex`) |
| Q10 | Font: Inter (neutral) or Space Grotesk (brand)? | Inter |
