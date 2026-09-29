# Blueprint: "My Experience" timeline

Status: v1 (indie-sa) | Input: docs/requirements/my-experience.md | Date: 2026-09-29 | Branch: `dev`
Stack (verified): Next 15.5 App Router, React 19, TS 5.7 strict, Tailwind v4 (`@theme` tokens in
app/globals.css), AOS 2.3.4, static JSON. No zod, no test runner, npm (`package-lock.json` tracked).

## 0. Verification findings (requirement doc vs actual code)

| # | Finding | Evidence |
|---|---------|----------|
| V1 | CONFIRMED and worse than reported: this is a runtime **crash**, not just wrong data. `projects` gets the Experience object and `ProjectCard` reads `project.windowStyles.backgroundColor` (undefined), so it throws. `contact` gets Projects and `contact.links.map` throws. `tsc` passes because of the `as unknown as RawSections` cast. | lib/content.ts:104-106 |
| V2 | DOC WRONG: the entries already have tech data. `skills: string[]` slugs (12/14/12 items). Only 7 slugs have icons. There are 19 without icons: reactjs, react-js, nextjs, expressjs, mysql, mongodb, aws, git, trpc, laravel, firebase-crashlytics, google-play, google-analytics, rest-api, agile, jira, confluence, scrum, kanban. `react-js` and `reactjs` are the same tech under two different slugs. | content/portfolio.json |
| V3 | DOC WRONG: Maybank has **10** responsibilities in JSON, not 8. | content/portfolio.json |
| V4 | DOC CONTRADICTS OWNER: FR-6 defaults the badge to the START year and FR-13 sorts by start. The owner's scope notes (doc lines 33, 36) say sort by END date with null on top, and the badge uses the END year. This blueprint follows the owner. Side effect: the Big Corridor badge renders 2023, not the 2020 shown in the screenshot. | doc §2 vs FR-6/FR-13 |
| V5 | DOC WRONG: every section title is an `h2` (About, Projects, Contact). Only Home has an `h1`. Experience uses `h2`, job title `h3`. | components/sections/*.tsx |
| V6 | Real breakpoint is `lg` (1024), not `xl`. The uncommitted diff moved IdeNavigation from xl to lg. Sidebar and `<main>` offset are already `lg`. PLAN.md's "md–xl: fixed nav, no sidebar" is stale. Actual tiers: `<md` mobile; `md–<lg` sticky 56px nav with links, no sidebar, static footer; `≥lg` fixed 72px titlebar nav **with no links**, fixed sidebar and footer. | IdeNavigation.tsx, FileExplorerSidebar.tsx, app/page.tsx |
| V7 | Nav duplication CONFIRMED. IdeNavigation has a local `NAV_LINKS` (Title case). constants.tsx `NAV_LINKS` (lowercase) is **unused**. The top nav has no hash-driven active state: `i === 0` is always yellow. Only the sidebar tracks the hash. | IdeNavigation.tsx:1-5,28 |
| V8 | WindowChrome's `●` and `— □ ×` are **not** aria-hidden today, so screen readers announce them. FR-15's "reuse whatever WindowChrome does" is insufficient. | components/ui/WindowChrome.tsx |
| V9 | `Icon` with an unknown slug does not crash. It renders a broken `next/image` (404). `iconSources` is only read when `color` is passed. It still lists all 16 SVGs, so it works as the "available icons" registry. | components/ui/Icon.tsx |
| V10 | `nodejs.svg` is a hexagon, so "hexagon" = Node.js is CONFIRMED. `git-branch` and `link` icons do not exist. | public/icons |
| V11 | `yarn.lock` is untracked next to the tracked `package-lock.json`. `gsap` was added to package.json but is imported nowhere. | git status, grep |

## 1. Summary
Add `ExperienceSection` (`#experience`, number 03 from JSON) between About(+Skills) and Projects in
`app/page.tsx`. It is a vertical `<ol>` timeline: a year badge and rail line on the left, and a
WindowChrome card on the right with title, company, date pill, responsibilities and icon-only tech
chips. First, fix the content loader so sections are resolved by an explicit `type` key and not by
array position (unblocks V1). Wire the section into the constants-driven nav, the sidebar,
SectionHashSync and AOS. Frontend only. No backend and no new dependencies.

## 2. Decisions
- **D1 Section lookup by `type`.** Every JSON section gets `"type": "hero"|"about"|"skills"|"experience"|"projects"|"contact"`.
  A pure `pickSections()` finds each by `type` and throws if one is missing, duplicated or unknown. Because the page is
  prerendered, the throw fails `next build`. Keying on `sectionName` was rejected because that is display copy ("OPEN EDITORS").
- **D2 Validation without zod.** Hand-written guards in a new `lib/content-schema.ts` (pure, no alias imports).
  Structural errors throw. Missing icons produce a dev-only `console.warn`. Only Experience gets deep validation. The other
  sections get presence + `type` checks (no scope creep).
- **D3 Keep `skills: string[]` slugs** in entries (the owner's existing shape) instead of the doc's `technologies` objects.
  A resolver maps slug to `{label, color, icon|null}`. Colour comes from the Skills section when a Skill has `icon === slug`
  (single source, so the same tech has the same colour as Skills). Otherwise it comes from `TECH_EXTRAS`, otherwise the fallback.
- **D4 All derivations are pure functions** in `lib/experience.ts`: sort, date labels, badge, tech resolution, view model.
  Components only render. Every assumption below is a constant or a JSON value.
- **D5 Dates are parsed from the ISO string** (`/^(\d{4})-(\d{2})/`) with a fixed English month array. No `Date`
  or timezone is involved. `new Date("2020-04-01T00:00:00+08:00")` gives *March* in UTC and would cause SSR/CSR hydration drift.
  Ordering uses `Date.parse` (absolute instant, safe).
- **D6 Layout** is a CSS grid per `<li>`: `[rail | card]`. The line segment lives inside each `<li>`, and the entry gap is
  `padding-bottom` on the `<li>`, not `gap` on the `<ol>`, so the line runs through the gap. The last `<li>` has no line.
  The rail is `aria-hidden` because the badge duplicates the `<time>` in the card.
- **D7 Nav consolidation.** IdeNavigation imports `NAV_LINKS` from constants.tsx. Extract the sidebar's hash
  listener into `components/useActiveHash.ts`, and use it in both the sidebar and the mobile nav so their highlights stay in sync.
- **D8 Reduced motion is global.** AosInit gets `disable: () => matchMedia("(prefers-reduced-motion: reduce)").matches`
  (AOS 2.3.4 supports a function and strips the `data-aos*` attrs). A CSS guard in globals.css prevents the pre-init invisible flash.
- **D9 Tests use `node:test`** with Node 22.18+ native type-stripping (local is 22.22.1). No dependency. Needs
  `"allowImportingTsExtensions": true` in tsconfig (valid with `noEmit`) and `"test": "node --test \"lib/**/*.test.ts\""`.
- **D10 WindowChrome a11y fix** (site-wide, visual no-op): wrap `●` and `— □ ×` in `aria-hidden="true"` spans.

## 2b. Assumptions (owner has not answered; each is a one-line or data override)

| # | Assumption (default adopted) | Source | Override location |
|---|------------------------------|--------|-------------------|
| A1 | Section number is 03, from JSON `sectionNumber`. Figma desktop "05" is stale. | Q1 | JSON |
| A2 | Badge = **END** year | owner §2 l.36 (beats Q5) | `EXPERIENCE_CONFIG.badgeRule: "end" \| "start"` |
| A3 | Null end: badge "Present", pill "MMM YYYY - Present" | Q5 | `EXPERIENCE_CONFIG.presentLabel` |
| A4 | Sort: end desc, null first, tie on start desc, then JSON order (stable) | owner §2 l.33 | `sortExperience()` |
| A5 | Subtitle: `{n} entries • verified` at md+ and `$ experience --timeline` below md, with n = entry count | Q3, owner l.37 | ExperienceSection copy (hardcoded chrome, same as Projects' "files open") |
| A6 | One `title` per entry on all breakpoints (no `titleMobile`) | Q2 | JSON |
| A7 | "Product Engineer" entry (same dates as Maybank) is kept as the owner wrote it and flagged | Q3 | JSON |
| A8 | Company shown = JSON `company` as-is | Q4 | JSON |
| A9 | One tech list per entry on all breakpoints; icon-only chips everywhere (Figma shows square icon chips) | Q6, owner l.38 | JSON `skills` |
| A10 | A slug with no icon renders as a text chip (reusing `TechTag`), not dropped | new | `EXPERIENCE_CONFIG.missingIcon: "text" \| "omit"` |
| A11 | `git` uses `git-branch.svg`; `rest-api` uses `link.svg`; `react-js` normalised to `reactjs` in JSON | V2, V10 | `TECH_EXTRAS` / JSON |
| A12 | Sidebar item `experience.md` with the `file-markdown` icon | Q7 | FILES array |
| A13 | Nav label "Experience" (keeps the current Title-case display) | Q7 | `SECTION_LABEL` |
| A14 | 0 entries: hide the section and its nav and sidebar links | Q13 | `showExperience` in page.tsx |
| A15 | Window glyphs are decorative (aria-hidden, no hover) | Q14 | WindowChrome |
| A16 | `description` is optional and not rendered | Q10 | n/a |
| A17 | Content layout switches at `md`; chrome boundary stays `lg`; PLAN.md is corrected | Q12, V6 | PLAN.md |
| A18 | Card titlebar accent `#FFD84D` (`yellow-alt`), **TBD-from-Figma** vs `#F5E642` | FR-7 | `EXPERIENCE_ACCENT` const |

## 3. Compatibility & risks
- Stack fit: no new libraries. AOS only, Tailwind utilities plus existing `@theme` tokens, npm. Do **not** commit
  `yarn.lock` (V11: owner to delete it or pick one package manager). Do not import `gsap`.
- Types: remove `as unknown as RawSections`. No `any`. Closed unions (`SectionType`, `BadgeRule`,
  `MissingIconMode`) use `switch` with a `default` that assigns the value to `never` and throws with it (lint-safe exhaustive check).
- Security: no `dangerouslySetInnerHTML` added. `Icon`'s existing use is fed only by repo-controlled `iconSources`.
  New SVGs come only from Figma exports.
- Hydration: `app/page.tsx` is `"use client"` but SSR'd. No `Date.now()` or locale formatting in render (D5).
  `data-aos` attributes are static.
- Hash sync: the section must be a direct child of `<main>` and rendered on first commit (SectionHashSync queries once on
  mount). `scroll-mt-20 lg:scroll-mt-[96px]` copies AboutSection (56px sticky nav, 72px fixed nav).
- Mobile nav overflow (R6): 4 Title-case links plus the logo and `fadhil.dev` measure about 375px, which will not fit at 320.
  Decision: `gap-2` below 390px and hide the handle text with `max-[389px]:hidden`. Verify at 320/360/390.
- The top nav has no links at ≥lg (V7), so the doc's AC "click experience in the fixed lg nav" applies to the sidebar instead.
- Pixel-perfect requirement: all dimensions are TBD-from-Figma (§3.1). Any deviation goes into PLAN.md "Known deviations".
- Pre-existing, out of scope (note only): `#skills` never activates; IdeStatusFooter has the invalid class `lg:px-`.

### 3.1 Figma pull list (indie-fe; fileKey `nWSm8ciH48pT40hzECT2KV`)
| Step | Node | Tool | Extract |
|------|------|------|---------|
| F1 | 76:1087 (desktop), 76:1329 (mobile) | get_metadata | Child node ids: Experience frame, header, each entry, badge, line, card, pill, chip instances, mobile nav, sidebar list |
| F2 | both frames + Experience children | get_screenshot | Visual reference, number badge, entry count, whether Figma has any "present" state |
| F3 | Experience frame (desktop, mobile) | get_design_context | Every TBD value below |
| F4 | chip instances | get_design_context (layer names) | slug per chip, fill per chip (confirms V2/A9/A11 mapping) |
| F5 | git-branch, link glyphs | download_assets | SVGs, strokes normalised to `#151515` like the existing icons |
| F6 | mobile nav in 76:1329; sidebar in 76:1087 | get_design_context | Link casing and count; sidebar filename and icon for experience |

**TBD-from-Figma (do not guess):** rail column width (mobile/desktop), rail-to-card gap, line width/colour/x-offset,
badge w/h/border/radius/bg/font-size/weight/shadow, entry vertical gap (doc says "~50px" mobile; unverified),
header-to-list gap, h2 size per breakpoint, subtitle size, titlebar colour, card body padding, title size/leading,
pill bg/border/radius/padding/font, company font, label font/tracking/colour, bullet indent/line-height/item gap,
chip size/radius/border/icon size/gap, per-tech fills for non-Skills slugs, card shadow at each breakpoint.
Figma has no md frame. At `md–<lg`, use desktop values and verify at 768/1024 with no overflow.

## 4. Contracts

### 4.1 JSON (content/portfolio.json). Every section adds `"type"`. Experience entry:
```jsonc
{ "start": "2023-08-15T00:00:00+08:00",   // required, ISO 8601 with offset
  "end": "2025-10-25T00:00:00+08:00",     // ISO or null (= present)
  "title": "…", "company": "…",           // required non-empty
  "filename": "experience.maybank.md",    // NEW, required, unique across entries
  "description": "…",                     // optional, not rendered
  "responsibilities": ["…"],              // string[] (may be empty: label block hidden)
  "skills": ["react-native", "git"] }     // slug[] (may be empty: label block hidden)
```

### 4.2 Types (lib/content.ts)
```ts
export type SectionType = "hero" | "about" | "skills" | "experience" | "projects" | "contact";
// each existing *Content interface gains  type: "<its literal>"
export interface ExperienceEntry {
  start: string; end: string | null; title: string; company: string; filename: string;
  description?: string; responsibilities: string[]; skills: string[];
}
export interface ExperienceContent {
  type: "experience"; sectionNumber: number; sectionName: string; sectionTitle: string;
  sectionTitleStyles: TextStyle; content: ExperienceEntry[];
}
// PortfolioContent gains  experience: ExperienceContent
```

### 4.3 lib/content-schema.ts (new, pure; `import type` only)
```ts
export function pickSections(raw: unknown[]): Record<SectionType, unknown>;   // throws: missing / duplicate / unknown type
export function validateExperience(raw: unknown): ExperienceContent;          // throws Error("experience.content[i].field: reason")
```
Rules: required strings non-empty after trim. `start`/`end` match `^\d{4}-\d{2}-\d{2}T`. `Date.parse(start) <= Date.parse(end)`.
Arrays are string arrays. `filename` is unique. content.ts calls both at module scope and exports the typed result.

### 4.4 lib/experience.ts (new, pure)
```ts
export type BadgeRule = "start" | "end";
export type MissingIconMode = "text" | "omit";
export const EXPERIENCE_CONFIG: { badgeRule: BadgeRule; presentLabel: string; missingIcon: MissingIconMode };
export const TECH_EXTRAS: Record<string, { label: string; color: string; icon?: string }>; // git: {Git,#FFFFFF,git-branch}, rest-api: {REST API,…,link}, …
export interface ResolvedTech { slug: string; label: string; color: string; icon: string | null }
export interface ExperienceItemView {
  key: string;            // = filename
  filename: string; title: string; company: string;
  startMonth: string;     // "2023-08" (for <time dateTime>)
  endMonth: string | null;
  startLabel: string;     // "Aug 2023"
  endLabel: string;       // "Oct 2025" | presentLabel
  badgeLabel: string;     // per badgeRule
  responsibilities: string[]; techs: ResolvedTech[];
}
export function sortExperience(e: ExperienceEntry[]): ExperienceEntry[];                 // non-mutating
export function formatMonthYear(iso: string): string;                                     // string-parsed, TZ-free
export function getBadgeLabel(e: ExperienceEntry, rule: BadgeRule, presentLabel: string): string;
export function resolveTech(slug: string, skills: Skill[], available: ReadonlySet<string>): ResolvedTech;
export function buildExperienceView(c: ExperienceContent, skills: Skill[], available: ReadonlySet<string>): ExperienceItemView[];
```
`available` is injected (`new Set(Object.keys(iconSources))` in the component) so the module has no alias imports and runs under `node --test`.
The fallback for an unknown slug is `{label: slug, color: "#FFFFFF", icon: null}` plus a dev `console.warn`.

### 4.5 Component contracts
```ts
ExperienceSection({ experience: ExperienceContent; skills: Skill[] })       // components/sections/ExperienceSection.tsx
ExperienceTimelineItem({ item: ExperienceItemView; index: number; isLast: boolean }) // same folder (li + rail + card)
ExperienceCard({ item: ExperienceItemView })                                // components/sections/ExperienceCard.tsx
TechIconChip({ tech: ResolvedTech })                                        // components/ui/TechIconChip.tsx, renders <li>
IdeNavigation({ showExperience: boolean }); FileExplorerSidebar({ showExperience: boolean })
useActiveHash(): string   // components/useActiveHash.ts; "#home" when hash is empty; listens to hashchange
```
constants.tsx: `SECTION_LABEL = {HOME:"Home", ABOUT:"About", EXPERIENCE:"Experience", PROJECTS:"Projects"}`, plus matching
`SECTION_HREF.EXPERIENCE = "#experience"`, and `NAV_LINKS` ordered Home, About, Experience, Projects.

### 4.6 DOM / responsive spec
```
<section id="experience" aria-labelledby="experience-title" class="scroll-mt-20 py-10 lg:scroll-mt-[96px]">
  <div data-aos="fade-up">SectionLabel | <h2 id="experience-title"> | <p subtitle: <span md:hidden>… <span hidden md:inline>…></div>
  <ol aria-label="Work history">                                  (no list-style)
    <li class="grid grid-cols-[RAIL_TBD_1fr] pb-[GAP_TBD] last:pb-0">
      <div aria-hidden="true" class="flex flex-col items-center">badge (data-aos="zoom-in") + {!isLast && <span class="flex-1 w-[TBD] bg-ink"/>}</div>
      <div data-aos="fade-up" data-aos-delay={Math.min(index*100,500)}>
        <WindowChrome filename accentColor> body:
          <div flex-col md:flex-row md:justify-between flex-wrap>
            <h3>title</h3>
            <p class="order-first md:order-none pill"><time dateTime="2023-08">Aug 2023</time> - <time …>Oct 2025</time></p>
          </div>
          <p company/> {resp.length>0 && <h4>RESPONSIBILITIES</h4><ul class="list-disc pl-[TBD] marker:text-ink">…</ul>}
          {techs.length>0 && <h4>TECHNOLOGIES</h4><ul class="flex flex-wrap gap-[TBD]"><TechIconChip/>…</ul>}
```
| Tier | Rail / badge | Date pill | Chips | Subtitle |
|------|-------------|-----------|-------|----------|
| `<md` (390 frame) | narrow rail column, badge top-left, line on left edge | above the title (`order-first`) | icon-only, wraps | `$ experience --timeline` |
| `md–<lg` (no sidebar, sticky nav) | desktop rail values | right of the title, wraps under it if tight | icon-only | `{n} entries • verified` |
| `≥lg` (1440 frame, sidebar, main = viewport-332px) | desktop values | right-aligned in the title row | icon-only | same |
The AOS attributes go on the card wrapper and the badge, **never on the line or the `<li>`** (prevents line flicker).
Bullets use the native `list-disc` marker (hanging indent, no literal "•" in the DOM).

### 4.7 Accessibility spec
- `<ol>`/`<li>` for entries, `<ul>`/`<li>` for bullets and chips, `h2` then `h3` then `h4`, with no skipped levels.
- The rail and badge are `aria-hidden` (the date is available in `<time>`). WindowChrome glyphs are aria-hidden (D10).
- Chip: `<li title={label}>` + `<Icon alt={label}>`. The `img` alt is the accessible name. No extra `aria-label` (avoids double announcement).
  The text fallback chip is its own label.
- No focusable elements in the section. Focus order is unchanged.
- Contrast was checked: `text-muted` #5f5a52 on #f7f1e3 is about 6.1:1 (pass). Ink icon on blue #3D8BFF is about 5.4:1 (pass, non-text ≥3:1).
  Re-check any Figma-supplied fills that are not in the palette.
- Reduced motion: D8. With `reduce` set, the content is visible immediately and nothing translates or scales.

## 5. Reuse map
| Existing | Path | Use | Gap |
|----------|------|-----|-----|
| WindowChrome / BoxView | components/ui/WindowChrome.tsx, BoxVIew.tsx | Card shell and shadow scaling | aria-hidden glyphs (D10) |
| SectionLabel | components/ui/SectionLabel.tsx | "03 EXPERIENCE.LOG" | none |
| ProjectsSection + ProjectCard | components/sections/ | Analogue: header layout, count subtitle, AOS delay, card split | none |
| TechTag | components/ui/TechTag.tsx | Text fallback chip (A10) | none |
| SkillChip classes | components/ui/SkillChip.tsx | Visual reference (`rounded-lg border-2 border-ink`, icon alt) | Not reusable as-is: shows text at md+. Do not modify it. |
| Icon + iconSources | components/ui/Icon.tsx, icon-sources.ts | Chip icons; `Object.keys` as the availability set | 2 SVGs (git-branch, link) |
| FileExplorerSidebar hash logic | components/layout/FileExplorerSidebar.tsx | Extract to `useActiveHash` | none |
| constants NAV_LINKS | components/constants.tsx | Single source of truth for the nav | add EXPERIENCE; delete the local copy |
| SectionHashSync, AosInit | components/ | Unchanged (hash) / add `disable` (AOS) | none |
| `.btn-press` | app/globals.css | Not applicable (nothing interactive in the cards) | none |
**Do not rebuild:** a window chrome, a section label, chip borders, a hash observer, or a date library. Do not add zod, a test framework or icons from npm.

## 6. Implementation map
| Slice | Files (N = new, M = modified) | Owner |
|-------|-------------------------------|-------|
| S0 Figma pull | this blueprint: append filled TBD table (M) | indie-fe |
| S1 Content contract + loader fix | content/portfolio.json (M: `type`, `filename`, `reactjs`), lib/content.ts (M), lib/content-schema.ts (N) | indie-fe |
| S2 Derivations | lib/experience.ts (N) | indie-fe |
| S3 Tests | lib/content-schema.test.ts (N), lib/experience.test.ts (N), tsconfig.json (M), package.json `test` script (M) | indie-qa |
| S4 Icons | public/icons/git-branch.svg (N), public/icons/link.svg (N), components/ui/icon-sources.ts (M) | indie-fe |
| S5 UI | components/sections/ExperienceSection.tsx (N), ExperienceCard.tsx (N), components/ui/TechIconChip.tsx (N), components/ui/WindowChrome.tsx (M), app/page.tsx (M) | indie-fe |
| S6 Nav/sidebar | components/constants.tsx (M), components/useActiveHash.ts (N), components/layout/IdeNavigation.tsx (M), FileExplorerSidebar.tsx (M) | indie-fe |
| S7 Motion | components/AosInit.tsx (M), app/globals.css (M) | indie-fe |
| S8 Docs | PLAN.md (M: 6 sections by `type`, lg boundary, experience, icons, test cmd, deviations), docs/requirements/my-experience.md (M: status) | indie-fe |
| S9 Verify | none (report) | indie-qa |
| S10 Review | none (findings) | indie-review |

## 7. Build sequence
Prerequisite: the owner checkpoint-commits or stashes the current dirty tree (R2 in the doc) and resolves `yarn.lock` vs `package-lock.json`.
1. [ ] **S0** Figma pull (parallel with S1–S3). This blocks S5 styling only, not its structure.
2. [ ] **S1** JSON `type` fields plus loader. Gate: `npm run typecheck && npm run build`, and the page renders Projects and Contact correctly (V1 fixed) before any UI work.
3. [ ] **S2** and **S3** in parallel. indie-qa writes the tests from §4.3/4.4 contracts first (red), and indie-fe makes them green.
4. [ ] **S4** icons (after F5).
5. [ ] **S5** section UI (needs S1, S2, S4, S0 values). WindowChrome aria fix.
6. [ ] **S6** nav/sidebar/hook (needs S5 for the `#experience` target). **S7** motion (parallel).
7. [ ] **S8** docs, then **S9** indie-qa matrix, then **S10** indie-review, then fixes, then an indie-qa re-run.

## 8. Acceptance criteria
Commands: `npm run typecheck`, `npm run lint`, `npm run build`, and `npm test` (plus `TZ=UTC npm test` and `TZ=Asia/Kuala_Lumpur npm test`). All must pass.
Unit tests (`node:test`), with one case per union member:
- [ ] `pickSections`: each of the 6 `SectionType` members resolves. Missing, duplicate and unknown `type` each throw.
- [ ] `validateExperience`: an empty company, `start > end`, a malformed ISO, a duplicate filename and a non-array `skills` each throw with a field path. Empty `responsibilities` passes.
- [ ] `sortExperience`: a null end sorts first, end desc, tie on start desc, stable. The input is not mutated.
- [ ] `formatMonthYear("2020-04-01T00:00:00+08:00") === "Apr 2020"` under both TZs.
- [ ] `getBadgeLabel`: `"end"` gives 2025 for Maybank, `"start"` gives 2023, and a null end gives presentLabel for each rule.
- [ ] `resolveTech`: a Skills-matched slug returns the Skills colour and title, a `TECH_EXTRAS` slug returns its entry, and an unknown slug falls back. Each `MissingIconMode` member is exercised in `buildExperienceView`.

Browser (indie-qa, at 390 / 768 / 1440, plus 320 and 1024 for overflow):
- [ ] Order is Home, About, Experience, Projects, Contact. Label "03 EXPERIENCE.LOG", h2 "MY EXPERIENCE". Projects shows 4 cards and Contact shows 4 links.
- [ ] Entries are newest-first by end date. Badges follow A2. Pills read "Aug 2023 - Oct 2025" style. The last entry has no line. The line is unbroken through the gaps.
- [ ] At 390 the pill is above the title and chips are icon-only and wrap. At 768/1440 the pill is in the title row. No horizontal scroll at 320–1440.
- [ ] The mobile nav fits on one line at 320 and 390. Clicking "Experience" shows the heading fully below the nav. The active nav link and the sidebar `experience.md` (≥lg, mint) both follow scroll.
- [ ] Scrolling from About to Experience to Projects updates the hash with `history.length` unchanged. Loading `/#experience` lands on the section with the sidebar item active.
- [ ] Setting `content: []` hides the section, the nav link and the sidebar item with no console errors. With 1 entry there is no dangling line.
- [ ] Side-by-side comparison against Figma 76:1087 / 76:1329. Deviations are listed in PLAN.md.
Accessibility:
- [ ] axe/Lighthouse: 0 new violations. The heading outline has no skipped levels. The responsibilities `<ul>` contains no literal "•" text, and no "— □ ×" is announced (VoiceOver spot check).
- [ ] Each chip's accessible name equals its label. Tab never enters the section.
- [ ] With emulated `prefers-reduced-motion: reduce`, content is visible immediately with no transforms. No hydration warnings in the console.

## 9. Out of scope
Branch `dev`. Out of scope: CMS/API, filters/expand/CV download, functional window controls, re-skinning other sections, the
`#skills` hash gap, the footer `lg:px-` class, removing `gsap`/`particles-bg`, committing `yarn.lock`, and any new npm dependency.
Unrelated modified files in the working tree must not be reformatted. Commit only when the owner asks.
