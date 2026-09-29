# Requirement Change: "My Experience" (work-experience timeline)

Status: Implemented on `dev` per docs/blueprints/my-experience.md (pending QA/review); was Draft v1 for indie-sa | Author: indie-pm | Date: 2026-09-29 | Prioritisation: MoSCoW
Repo: portfolio2.0 (Next.js 15 App Router, TS, Tailwind v4, static JSON content, AOS)

## 1. Summary & goal

Add a "My Experience" section: a vertical timeline of work-history entries, each rendered as a
WindowChrome-style "file" card (yellow titlebar, hard shadow) with role, company, date pill,
responsibilities, and technology icon chips. It sits between About/Skills and Projects, is
reachable from top nav + sidebar, participates in URL-hash sync, and is content-driven from
`content/portfolio.json`. Goal: visitors (recruiters) see career history at a glance, in the same
IDE visual language as the rest of the site, on desktop and mobile.

KEY FINDING (read first): the repo working tree is already partly ahead of this doc.
- `content/portfolio.json` (uncommitted) already contains an EXPERIENCE.LOG section: `sectionNumber: 3`,
  `sectionTitle: "MY EXPERIENCE"`, 3 entries. Projects is now 4 and Contact is 5.
- `lib/content.ts` (unmodified) still maps 5 sections positionally
  (`[hero, about, skills, projects, contact]`). With 6 sections in JSON, `projects` currently receives the
  Experience object and `contact` receives Projects. This is a live bug in the working tree; it must be
  fixed first (FR-1) and is a blocker for everything else.
- The JSON entries have no `technologies`, no card `filename`, and the first two entries have
  identical date ranges (looks like a copy/paste). See Open Questions Q2/Q3/Q9.

## 2. Scope / out of scope

In scope
- New `ExperienceSection` (timeline + cards), desktop and mobile layouts per Figma.
- Content schema + TS types + JSON data for experience entries (incl. technologies).
- Nav (`NAV_LINKS`, `IdeNavigation`), sidebar (`FILES`), hash-sync, AOS wiring.
- Any missing tech icons (git-branch, link) exported from Figma.
- Fix positional-tuple mapping in `lib/content.ts` and update PLAN.md data-flow note.
- Although JSON already sort the experience timeline, always do sorting based on end date (item with but ensure end: null is on top)
- Follow the design exactly, need to be pixel perfect
- Last item won't have the timeline line
- the timeline node is year based on end date
- the workspace note "3 entries ..." - the number got from total experience i have
- as for skill, use icon match the skill name, design wise similar to skill (in mobile view - icon only)

Out of scope (Won't this time)
- CMS / DB / API; content stays static JSON.
- Filtering, sorting UI, expand/collapse, "download CV", per-entry pages.
- Functional window controls (min/max/close are decorative).
- Re-skinning other sections; renumbering beyond what the JSON already has.
- Any new animation library (AOS only).

## 3. Stakeholders & assumptions

Stakeholder/decider: site owner (Fadhil). Consumers: recruiters/hiring managers on desktop + mobile.

Assumptions (state-and-confirm; each also in section 10 where it is a real decision)
- A1. Screenshots are authoritative for visuals; Figma nodes (section 4.0) are authoritative once pulled,
  and the diff between the two is reported back to the owner before build.
- A2. Section order: Home, About(+Skills), Experience, Projects, Contact. Number `03` (matches JSON + mobile).
- A3. Entries display newest first.
- A4. "Present" roles are possible; `end` may be null.
- A5. Icons are decorative-with-label chips; no external links per entry.
- A6. No new npm dependencies.
- A7. Tailwind breakpoints per PLAN.md: `<md` mobile, `md-xl` narrow desktop, `>=xl` full desktop.
  NOTE: existing components mix `md:` and `lg:` (page.tsx main uses `lg:ml-[300px]`, nav uses `lg:`), so
  PLAN.md and code disagree on where the sidebar appears. indie-sa must confirm the real boundary (Q12).

## 4. Functional requirements (MoSCoW)

### 4.0 Figma nodes to pull (indie-sa / indie-fe; I could not verify these, no Figma tool)
File key `nWSm8ciH48pT40hzECT2KV`, page "Finished".
| Node | Tool | Purpose |
|------|------|---------|
| 76:1087 (desktop 1440) | get_metadata, then get_screenshot | Locate the Experience frame/child node ids; confirm section number badge |
| 76:1329 (mobile 390) | get_metadata, then get_screenshot | Same for mobile |
| Experience section child node (desktop) - ID UNKNOWN | get_design_context | Spacing, type scale, rail width, badge size, shadow values, colours |
| Experience section child node (mobile) - ID UNKNOWN | get_design_context | Mobile rail offset, card width, ~50px entry gap |
| Year badge instance (both) - ID UNKNOWN | get_design_context | Border, size, font |
| Tech chip instances + any git-branch / link icons - IDs UNKNOWN | get_design_context, download_assets | Export SVGs to `public/icons/`, then register in `icon-sources.ts` (see how existing icons were added) |
| Date pill, "RESPONSIBILITIES"/"TECHNOLOGIES" labels - IDs UNKNOWN | get_design_context | Tokens |
| 76:578 (page "Finished" root) | get_screenshot | Whole-page context and nav/sidebar states |
Unverified: whether the Figma has a 3rd entry, a "present" state, empty state, hover states, and the
mobile/desktop titles (Q2). All child node IDs above must be discovered; none are known.

### FR-1 Content pipeline fix (Must)
Make content access resilient to the added section. Requirements:
- `PortfolioContent` gains `experience: ExperienceContent`; `projects` and `contact` resolve to the correct sections.
- Mapping must not depend on array position alone (e.g. find by `sectionName`, or update the tuple); no silent misassignment.
- PLAN.md "Data flow" paragraph updated (5 -> 6 sections).

### FR-2 Content model (Must)
Proposed type (indie-sa may refine; names are proposals):
```ts
export interface ExperienceTech {
  icon: string;            // slug in public/icons, e.g. "react-native"
  label: string;           // accessible name, e.g. "React Native"
  style?: { backgroundColor: string; color?: string }; // optional override; default from tech colour map
}
export interface ExperienceEntry {
  start: string;           // ISO 8601, e.g. "2023-08-15T00:00:00+08:00" (existing format)
  end: string | null;      // null = present
  title: string;
  company: string;
  filename: string;        // titlebar text, e.g. "experience.maybank.md"
  description?: string;    // exists in JSON today; not shown in screenshots (Q10)
  responsibilities: string[];
  technologies: ExperienceTech[];
  titleMobile?: string;    // ONLY if Q2 resolves to "titles genuinely differ"
}
export interface ExperienceContent {
  sectionNumber: number; sectionName: string; sectionTitle: string;
  sectionTitleStyles: TextStyle; subtitle?: string;   // see FR-4
  content: ExperienceEntry[];
}
```
Example entries (text verbatim from screenshots; dates from screenshots, ISO by indie-fe):
- Maybank: title "Software Developer" (desktop) / "Frontend Developer" (mobile) [Q2], company "Maybank"
  (JSON says "Maybank Shared Services Sdn Bhd"; screenshot shows a shorter form, Q4), date pill "Aug 2023 - Oct 2025",
  filename "experience.maybank.md", 8 responsibilities (JSON has 8 - use them), technologies per FR-7.
- Big Corridor: title "React Native Developer" (screenshot) vs JSON "Developer" [Q2], company "Big Corridor",
  date pill "Apr 2020 - Jul 2023" (JSON 2020-04-01 to 2023-08-01: end month is Aug in JSON, Jul in screenshot [Q9]),
  filename "experience.bigcorridor.md", 7 responsibilities (JSON has 7).
- JSON entry 1 ("Product Engineer", Big Corridor, 2023-08-15 to 2025-10-25, 4 bullets) overlaps Maybank exactly [Q3].
Data validity rule: build/type-check must fail or warn (dev-time check acceptable) if `start > end`, or a required field is empty.

### FR-3 Section placement & numbering (Must)
- Rendered in `app/page.tsx` after About/Skills and before Projects.
- Uses `SectionLabel` with `sectionNumber` from JSON (default 3) and `sectionName` "EXPERIENCE.LOG"; H1 "MY EXPERIENCE".
- Root element `<section id="experience">` inside `<main>` with a `scroll-mt-*` sized to the fixed nav
  (nav is 72px fixed at `lg`, 56px sticky below; existing sections use scroll-mt-20 / [96px] / [100px] / [30px], which are inconsistent - indie-sa to pick a value that lands the heading visibly under the nav).
- Figma desktop shows "05", mobile "03": resolved by Q1 (default: JSON-driven "03", flagged as Figma discrepancy).

### FR-4 Header block (Must)
- Chip + "EXPERIENCE.LOG", H1 "MY EXPERIENCE" (Space Grotesk bold, style from `sectionTitleStyles`), muted mono subtitle.
- Subtitle text differs by breakpoint in the screenshots ("3 entries • verified" desktop; "$ experience --timeline" mobile).
  Default: derive count from data (`{n} entries • verified`) shown at md+, and `$ experience --timeline` on mobile, both
  hardcoded UI copy or JSON fields (Q3). "verified" is unverifiable claim text; confirm owner wants it (Q3).

### FR-5 Timeline layout (Must)
Desktop (md+ / xl per Q12): two-column row per entry - left rail with year badge, right the card; a continuous thin vertical
line connects badges through all entries (line must not extend past the last badge, or must fade - confirm in Figma).
Mobile (<md): rail is a narrow left column; year badge top-left of each entry, line runs down the left edge; card to its
right (narrower); ~50px gap between entries; line continues across the gap.
- Badge: white box, black border, mono text, year (see FR-6).
- No horizontal scroll at 320px width.

### FR-6 Year badge rule (Must)
Screenshots: Maybank badge 2025 (end year), Big Corridor badge 2020 (start year) - inconsistent (Q5).
Default: badge = START year of the entry (chronologically consistent with a timeline reading bottom-up), unless owner picks
END year or "range". Derived from data (not hand-typed) so it cannot drift from the pill. Present roles show "Present" or current year (Q5).

### FR-7 Card anatomy (Must)
Reuse `WindowChrome` (do not reimplement; extend props only if needed).
- Titlebar (yellow): dot + filename, right-side glyphs min/max/close; thick black border; hard offset shadow (scale like other windows: mobile smaller, md+ larger).
- Body order desktop: row [job title (bold, large) | date pill (yellow) right-aligned]; company (mono bold);
  label "RESPONSIBILITIES" (small caps/mono); bullet list with "•"; label "TECHNOLOGIES"; chip row.
- Body order mobile: date pill FIRST, then title, company, labels, bullets, chips (wrap to 2 rows).
- Responsibilities render as a real `<ul>`/`<li>` (visual "•" via CSS marker or ::before, not typed characters). Wrapped lines hang-indent.
- Long content: 8-bullet card must not overflow; title and pill wrap gracefully at md.

### FR-8 Tech chips (Must)
- Square (approx 32-40px, confirm Figma) chip, black border, coloured fill, centred icon from `Icon` component.
- Fill colours follow the site palette already in `portfolio.json` skills: white #FFFFFF, pink #FF5CAA, yellow #F5E642,
  mint #66E3B4, blue #3D8BFF. Default: single technology->colour map (same tech = same colour everywhere), matching Skills:
  React Native white, Java pink, JavaScript yellow, Android mint, TypeScript blue, Node.js white, Firebase pink; new git-branch white, link (colour per Figma).
- Observed sets (screenshots): Maybank desktop = RN, TS(pink), JS, android, TS(blue), node, firebase, git-branch. TS appears
  twice with two colours, which is almost certainly the pink one being Java (pink = Java on Skills) (Q6). Big Corridor = RN, JS, node/hexagon,
  link, android, TS, git-branch. Mobile chip set for Maybank = RN, JS, hexagon, link, android, TS, git-branch (i.e. the Big Corridor set).
  Default: ONE technology list per entry, identical on all breakpoints (Q6).
- Icons: existing in `public/icons` + `icon-sources.ts`: react-native, java, javascript, typescript, android, nodejs, firebase.
  Missing (export from Figma): git-branch, link/chain. "hexagon" in the screenshots = existing `nodejs` icon (verify in Figma).
  Note Icon component recolours strokes; confirm new SVGs follow same stroke conventions (#151515).
- Each chip exposes accessible name: `title` + `aria-label` (or visually-hidden text) from `ExperienceTech.label`. No text label on screen.

### FR-9 Navigation integration (Must)
- `NAV_LINKS` in `components/constants.tsx` and `SECTION_LABEL`/`SECTION_HREF` gain EXPERIENCE ("experience", "#experience"), ordered Home, About, Experience, Projects.
- `IdeNavigation.tsx` currently declares its OWN local `NAV_LINKS` (Home/About/Projects), ignoring constants.tsx; requirement: one source of truth (Q11).
- Note Contact is in the sidebar but not in top nav today; do not change that (out of scope) unless owner asks.
- Mobile nav is a tight single row (3 links today); adding a 4th must not overflow at 320-390px (verify visually).

### FR-10 Sidebar integration (Must)
- `FILES` in `FileExplorerSidebar.tsx` gains an entry between about.json and projects.md: name `experience.md`
  (proposed; owner may prefer `experience.log`), href `#experience`, icon: reuse an existing file icon (default `file-markdown`, no new asset) (Q7).
- Active highlight (mint) works via hash equality.

### FR-11 Hash sync compatibility (Must)
- `SectionHashSync` observes `main section[id]` with a thin middle band (-40% / -55%). Requirement: the experience `<section>` has
  id "experience", is a direct descendant of `main`, and intersects the band as user scrolls (very tall 8-bullet cards on mobile are fine; very short sections could be skipped - verify).
- Known caveat (not new, flag to indie-sa): Skills has no own id, so `#skills` never activates; Experience must not be nested inside About's `<section>`.
- Deep link `/#experience` on load scrolls to the heading and highlights the sidebar item. Note page.tsx only forces scroll-to-top when hash is empty or #home.
- `SectionHashSync` is mounted in `app/layout.tsx` (verified); no wiring work needed.

### FR-12 Animation (Should)
- AOS `data-aos` on header (`fade-up`) and per entry (card `fade-up`/`fade-left`, badge `zoom-in`), delays capped like Skills (`Math.min(index*100, 500)`). AosInit uses `once: false` and duration 300.
- The rail line must not be inside a `data-aos` wrapper that hides it (line flicker); animate cards not the line, or animate the line as a whole.
- `prefers-reduced-motion`: no transform animation (Should; AOS `disable` option or CSS override; indie-sa to decide global vs local).
- AOS attributes on SSR'd markup must not cause hydration mismatches.

### FR-13 Ordering rule (Must)
Render in reverse-chronological order by `start` (tie-break by `end`, null/present first) computed in code, NOT trusting JSON order
(JSON today is not ordered consistently). If owner prefers hand-ordered, document it (Q8).

### FR-14 Empty / edge states (Should)
- 0 entries: section renders header with "0 entries" and a muted mono line (e.g. `// no entries yet`) or is hidden entirely and removed from nav/sidebar (Q13). Default: hide section + nav/sidebar links.
- 1 entry: line has no dangling tail. Entry with 0 responsibilities or 0 technologies: omit that label block.
- Very long company/title strings wrap; no overflow.

### FR-15 Decorative window controls (Should)
Min/max/close glyphs are decorative: `aria-hidden="true"`, not focusable, no hover/pointer affordance implying function. Reuse whatever WindowChrome does today (Q14).

### FR-16 Could-haves
- Duration text ("2 yrs 2 mos") next to pill. Hover state on chips revealing label tooltip. Print styles. JSON-LD `Person.worksFor`/`hasOccupation` (SEO).

## 5. Non-functional requirements

- Responsive: verify at 320, 390, 768, 1024, 1280, 1440 px. Layout switches match existing `md` (content mobile/desktop) and sidebar boundary (Q12). No horizontal overflow at any width.
- Accessibility (WCAG 2.2 AA target): section is a landmark-ish `<section aria-labelledby>` with the H1; heading order: H1 "MY EXPERIENCE" (consistent with other sections), job title as H3 (or H2 if H1s are per-section elsewhere - indie-sa to check heading outline across page; do not skip levels).
  Timeline as `<ol>` (entries) with `<li>`; bullets `<ul>`. Date as `<time datetime="...">`. Chips: labelled (FR-8). Text contrast >= 4.5:1: verify muted mono subtitle (`text-muted`) on the cream background, and black-on-yellow pill (fine). Focus order = DOM order; nothing interactive in cards.
- Reduced motion: FR-12.
- Performance: no new dependencies; icons inline via existing `icon-sources` (no extra requests); server-render content. CLS = 0 from the section (reserve chip sizes). Note `app/page.tsx` is `"use client"` today, so content is not server-only; do not worsen this. Lighthouse Performance/Accessibility must not regress vs baseline captured before the change.
- SEO: real text in DOM (not images); semantic headings; optional JSON-LD (Could). Page title/description unchanged.
- Maintainability: adding an entry = JSON edit only (plus an icon SVG if new tech). No hardcoded per-company logic in components.
- Visual fidelity: within Figma tolerance used elsewhere (see PLAN.md "Known deviations"); document any deviation.

## 6. Acceptance criteria (Given / When / Then)

- FR-1: Given the current 6-section JSON, When the app builds and renders, Then Projects shows the 4 project cards, Contact shows contact links, Experience shows experience, and `tsc --noEmit` + `next build` pass.
- FR-2: Given an entry missing `company` or with `start` after `end`, When type-check/dev validation runs, Then it is reported (fails or warns per indie-sa's decision). Given the example entries, Then they parse against `ExperienceEntry`.
- FR-3: Given the home page, When I scroll, Then the order is Home, About, Experience, Projects, Contact; the label chip shows the padded number from JSON ("03"); H1 reads "MY EXPERIENCE".
- FR-4: Given 3 entries at >=md, Then the subtitle reads "3 entries • verified" (if Q3 default) and at <md reads "$ experience --timeline". Given entries change to 2, Then the count updates without code edits.
- FR-5: Given width 1440, Then each entry shows rail left, card right, one continuous line. Given width 390, Then badge top-left, line on left edge, ~50px entry gap, line unbroken between entries, no horizontal scroll.
- FR-6: Given Maybank (start 2023, end 2025) and Big Corridor (start 2020), Then badges show the year per the Q5 decision, computed from data; a "present" entry shows the Q5-decided label.
- FR-7: Given the Maybank entry at 1440, Then order is title|pill, company, RESPONSIBILITIES, 8 bullets, TECHNOLOGIES, chips; at 390 the pill is above the title. Bullets are `<li>` elements; the DOM contains no literal "•" characters.
- FR-8: Given a technology with slug `git-branch`, When rendered, Then a square chip with black border shows the icon and has `aria-label`/title "Git". Given an unknown icon slug, Then no crash (fallback/omit + dev warning). All chip colours equal the tech->colour map; same tech has same colour in all cards.
- FR-9: Given the top nav, When I click "experience", Then the URL becomes `#experience` and the heading sits fully visible below the nav (both fixed lg nav and sticky mobile nav). Nav does not wrap/overflow at 320px.
- FR-10: Given the sidebar at full desktop, Then `experience.md` appears between about.json and projects.md; When on the experience section, Then it is highlighted mint and others are not.
- FR-11: Given I scroll from About through Experience to Projects, Then the hash goes `#about` -> `#experience` -> `#projects` with no history entries added (`history.length` unchanged). Given I load `/#experience`, Then it scrolls to the section and the sidebar item is active.
- FR-12: Given first paint, Then header and cards animate in with AOS; Given `prefers-reduced-motion: reduce`, Then no translate/scale animation runs (content visible immediately). No hydration warnings in console.
- FR-13: Given entries supplied in arbitrary order, Then display is newest-first per section 4 FR-13.
- FR-14: Given `content: []`, Then behaviour per Q13 default with no console errors; given 1 entry, no dangling line.
- FR-15: Given keyboard Tab through the section, Then focus never lands on window glyphs; screen reader does not announce them.
- NFR: axe (or Lighthouse a11y) reports 0 new violations in the section; Lighthouse a11y/perf scores not lower than the pre-change baseline.

## 7. Files likely impacted (names only; design belongs to indie-sa)

- `content/portfolio.json` (fix/complete the existing experience section; add `technologies`, `filename`)
- `lib/content.ts` (types, positional mapping, `PortfolioContent.experience`)
- `components/sections/ExperienceSection.tsx` (new); possibly `ExperienceCard`, `TimelineRail`, `TechChip` under `components/ui/`
- `app/page.tsx` (render order); `app/layout.tsx` (confirm SectionHashSync mounted)
- `components/constants.tsx` (SECTION_LABEL/HREF/NAV_LINKS)
- `components/layout/IdeNavigation.tsx` (duplicate local NAV_LINKS), `components/layout/FileExplorerSidebar.tsx` (FILES)
- `components/ui/WindowChrome.tsx` (prop tweaks only if needed), `SectionLabel.tsx` (likely unchanged)
- `public/icons/git-branch.svg`, `public/icons/link.svg`, `components/ui/icon-sources.ts`
- `PLAN.md` (data flow + section list); `components/SectionHashSync.tsx` (only if verification finds a defect)

## 8. Dependencies & risks

| # | Risk / dependency | Impact | Mitigation |
|---|-------------------|--------|------------|
| R1 | Positional tuple in `lib/content.ts` misassigns sections NOW | App renders wrong data today | FR-1 first, before any UI work |
| R2 | Uncommitted, half-edited working tree (many M files, JSON already changed) | Merge/attribution confusion, lost work | Owner commits or stashes a checkpoint before build begins |
| R3 | Figma child node IDs unknown; no Figma tool here | Estimates for pixel fidelity are low-confidence | indie-sa/fe pulls nodes first (section 4.0); re-estimate after |
| R4 | Screenshot vs JSON vs mobile content contradictions (Q2-Q6, Q9) | Building the wrong content | Get owner answers before content authoring (Task T2) |
| R5 | Missing icons (git-branch, link) | Small blocker on chips | Export via Figma download_assets; fallback: omit chip |
| R6 | Mobile nav space, tall cards vs 40/55% observer band, inconsistent scroll-mt values | Nav overflow / wrong active section | Explicit visual QA cases (AC FR-9, FR-11) |
| R7 | `app/page.tsx` is a client component; AOS + SSR hydration | Warnings/flicker | Keep section pure; AOS attrs only |
| R8 | md vs lg breakpoint inconsistency in existing code (Q12) | Layout switch at the wrong width | indie-sa decides once; document |
| R9 | Scope creep magnets: detail modal, filters, CV download, duration text | Estimate blowup | Listed as Won't/Could; any pull-in is new scope, re-estimate |
Dependencies: FR-1 blocks all; owner content decisions block T3; Figma pull blocks fidelity work; icons block chip completion.

## 9. Task breakdown (sequenced)

Estimates are ranges with confidence (H/M/L). Sizes: S < 0.5 day, M 0.5-1.5 days, L 1.5-3 days. Effort is agent+owner-review time.
| ID | Task | Pri | Size / range | Conf | Depends on | Owner |
|----|------|-----|--------------|------|------------|-------|
| T0 | Owner answers blocking questions Q1-Q6, Q9; checkpoint-commit working tree | Must | S (owner wait time varies) | H | none | user |
| T1 | Pull Figma nodes (4.0), reconcile screenshot vs Figma, report diffs; write blueprint (types, component split, breakpoint decision, a11y outline, hash/scroll-mt plan) | Must | M (0.5-1 d) | M | T0 (Q answers preferred; can start in parallel) | indie-sa |
| T2 | Fix content mapping + types + complete JSON entries (FR-1, FR-2), update PLAN.md | Must | S (1-3 h) | H | T1 blueprint | indie-fe (indie-be N/A: static JSON, no backend) |
| T3 | Export/register missing icons (git-branch, link) | Must | S | M | T1 | indie-fe |
| T4 | ExperienceSection: header, timeline rail, card, chips, desktop + mobile layouts (FR-3..8, 13, 14, 15) | Must | L (1.5-3 d) | L-M until Figma pulled | T2, T3 | indie-fe |
| T5 | Nav + sidebar + constants + hash sync + scroll-mt (FR-9..11) | Must | S-M (2-5 h) | M | T4 (can start with stub section id after T2) | indie-fe |
| T6 | AOS + reduced motion (FR-12) | Should | S | M | T4 | indie-fe |
| T7 | Test plan and execution: responsive matrix, a11y (axe/keyboard/screen reader), hash-sync scroll, deep link, empty/1/3-entry data, build + tsc | Must | M (0.5-1 d) | M | T4-T6 | indie-qa |
| T8 | Code/security/a11y review against this doc | Must | S | H | T7 | indie-review |
| T9 | Fix findings, re-verify | Must | S-M | L | T7, T8 | indie-fe, then indie-qa |
Critical path: T0/T1 -> T2 -> T4 -> T5 -> T7 -> T8. T3 parallel with T2. T6 parallel with T5.
Total: about 4-8 working days elapsed for one implementer; low confidence until Figma nodes are pulled (re-estimate after T1). Backend (indie-be): none required.
Milestones: M1 Data + mapping fixed, app renders correct sections (T2). M2 Section visible on desktop/mobile matching Figma (T3-T4). M3 Integrated in nav/sidebar/hash + animation (T5-T6). M4 Verified + reviewed (T7-T9).

## 10. Open questions

| # | Question | Why it matters | Recommended default | Owner |
|---|----------|----------------|---------------------|-------|
| Q1 | Section number: Figma desktop "05" vs mobile "03"; JSON already Experience=3, Projects=4, Contact=5, and Skills=2 | Label mismatch; order of sections | Follow JSON (03). Treat desktop "05" as stale Figma. Confirm order Home, About, Experience, Projects, Contact | user |
| Q2 | Job titles: "Software Developer" (desktop) vs "Frontend Developer" (mobile) for Maybank; JSON says "Developer"; Big Corridor "React Native Developer" vs JSON "Developer" | Factual accuracy of a CV | One title per entry, same on both breakpoints; owner supplies true titles. Do NOT add `titleMobile` | user |
| Q3 | Subtitle "3 entries • verified" vs "$ experience --timeline"; count 3 vs 2 cards visible; JSON has 3 entries; entry 1 (Product Engineer, Big Corridor 2023-08-15 to 2025-10-25) duplicates Maybank's dates | Content correctness; "verified" is an unsubstantiated claim | Show count derived from data. Owner confirms if a 3rd role exists (and its dates) or deletes it. Desktop: "N entries • verified"; mobile: "$ experience --timeline" (or unify) | user |
| Q4 | Company names: "Maybank" / "Big Corridor" (screens) vs "Maybank Shared Services Sdn Bhd" / "Big Corridor Sdn Bhd" (JSON) | Legal vs display name | Display screenshot short names; keep full name in JSON `legalName` optional / or use short in `company` | user |
| Q5 | Year badge = start or end year? Maybank 2025 (end) vs Big Corridor 2020 (start) | Timeline reads inconsistently; present roles | START year, computed from data; "Present" label for null end | user |
| Q6 | Tech lists differ per breakpoint and per card; Maybank shows TS twice (pink and blue) - is pink actually Java? Is "hexagon" = Node.js? What are the true tech lists and colours? | Wrong tech = wrong CV claims; colour consistency | One list per entry, all breakpoints; tech->colour map same as Skills; pink = Java; hexagon = nodejs | user (content), indie-sa (map) |
| Q7 | Sidebar filename/icon and top-nav label for Experience | Consistency with `home.tsx`, `about.json`, `projects.md`, `contact.sh` | `experience.md`, `file-markdown` icon (reuse), nav label "experience" | user |
| Q8 | Ordering: computed newest-first vs hand-ordered JSON | Consistency | Computed newest-first | indie-sa |
| Q9 | Dates: Big Corridor end "Jul 2023" (screenshot) vs 2023-08-01 (JSON); Maybank start 2023-08-15, end 2025-10-25 vs pill "Aug 2023 - Oct 2025" | Accuracy; timezone (+08:00) can shift month when parsed in UTC | Owner confirms; format pill from ISO in a fixed locale/timezone (avoid hydration mismatch) | user / indie-sa |
| Q10 | `description` field in JSON is not shown in screenshots - drop, keep as SEO/meta, or show? | Dead data | Keep field optional, do not render | user |
| Q11 | `IdeNavigation` has a duplicate local NAV_LINKS; consolidate into constants.tsx? | Two sources of truth will drift | Yes, consolidate as part of this change (small) | indie-sa |
| Q12 | Sidebar boundary: PLAN.md says `xl`, code uses `lg`; timeline breakpoints md vs xl | Layout switch width | Content layout switch at `md` (as PLAN.md); leave sidebar boundary as coded and fix PLAN.md wording | indie-sa |
| Q13 | Empty state: hide section or show placeholder | Robustness | Hide section and its nav/sidebar links | user |
| Q14 | Window glyphs decorative only? Any hover behaviour? | A11y semantics | Decorative, aria-hidden, no hover | user |
| Q15 | Skills has no own section id, so `#skills` never activates (SectionHashSync is mounted in layout.tsx) | Pre-existing gap, not Experience-specific | Out of scope; note only | indie-sa |

## 11. Definition of done

Per milestone (M1-M4 in section 9) and overall. Gate against `indie-compat-gates` (stack, security, quality basics) before "finished":
- Stack: `npx tsc --noEmit` clean, `next build` succeeds, ESLint clean; no new dependencies; Next 15 App Router and Tailwind v4 conventions followed; no server/client boundary regressions or hydration warnings.
- Security: no `dangerouslySetInnerHTML` for content; SVG icons only from repo-controlled sources; no external requests added; no secrets/PII in JSON beyond existing public info.
- Quality: every FR-x Must/Should acceptance criterion in section 6 demonstrably passes (indie-qa report with real outcomes, not assumed); responsive matrix and a11y checks executed; no open Critical/High indie-review finding.
- Content: Q1-Q6 and Q9 answered by owner and reflected in JSON; no overlapping/duplicate entries; all texts match approved copy.
- Design: side-by-side comparison to Figma desktop 76:1087 and mobile 76:1329 documented, deviations listed in PLAN.md "Known deviations".
- Docs: PLAN.md updated (6-section data flow, new component, icons). This requirement file marked "Implemented" with any deviations.
- Working tree: changes committed by the owner/agent request only, feature isolated from unrelated modified files.
