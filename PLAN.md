# Portfolio 2.0 — architecture & context

This file is the durable context for this repo: why it's built the way it is, and how the pieces
fit together. Read this before making structural changes.

## What this is

A personal portfolio ("Fadhil/Dev") styled as a fake IDE/code-editor UI, built from a Figma design
(file `Portfolio`, fileKey `nWSm8ciH48pT40hzECT2KV`, page **"Finished"**, node `76:578`):

- **Desktop** frame — node `76:1087` (1440px)
- **Mobile** frame — node `76:1329` (390px)

Both breakpoints are implemented in a single responsive Next.js codebase (no separate mobile
build), using Tailwind CSS responsive variants.

## Stack & decisions

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **Content**: static JSON only (`content/portfolio.json`), no database/API/Supabase. This was a
  deliberate choice — the portfolio has no CMS UI in the design and only the owner edits content,
  so a JSON file read server-side is simpler than standing up Supabase + API routes for content
  that changes rarely. Revisit this only if the owner wants to edit content without redeploying.
- **Fonts**: Space Grotesk (headings/body), JetBrains Mono (UI labels/status text), Courier Prime
  (About/README body copy) — all via `next/font/google`, wired in `app/layout.tsx`.
- All icon/asset SVGs were downloaded from Figma (not redrawn) into `public/icons/`, per the
  design-to-code rule of using real design assets.

## Breakpoints (Tailwind default scale)

- `< md` (768px): **mobile** layout — sticky nav (`position: sticky`), no sidebar, footer in
  normal document flow (not fixed), single-column content.
- `md`–`xl` (768–1279px): **narrow desktop** — same fixed nav/footer as full desktop, but the file
  explorer sidebar is hidden (this is what "sidebar fixed on the left until content no longer
  fits, then hide it" means in practice).
- `≥ xl` (1280px+): **full desktop** — fixed nav top, fixed file-explorer sidebar left, fixed
  status footer bottom, matching the 1440px Figma frame.

The skills-chip content switch (label+title text on desktop vs. icon-only on mobile) uses the same
`md` boundary as the general mobile/desktop split, not the `xl` sidebar boundary.

## Data flow

`content/portfolio.json` → `lib/content.ts` (`getPortfolioContent()`, fully typed) → `app/page.tsx`
passes typed slices into section components. Nothing else reads the JSON directly.

The JSON's 5 `sections` map positionally to named fields in `lib/content.ts`:
`hero`, `about`, `skills`, `projects`, `contact` (see `RawSections` tuple type). If the JSON's
section order ever changes, update that tuple.

`sections[1].skills[*].icon` and `sections[3].content[*].links[*].icon` are icon **slugs**
(`react-native`, `java`, `android`, `javascript`, `nodejs`, `firebase`, `typescript`, `youtube`,
`external-link`), each resolving to `public/icons/<slug>.svg` via the `Icon` component
(`components/ui/Icon.tsx`). Add a new skill/link icon by dropping an SVG in `public/icons/` and
using its filename (without extension) as the `icon` value.

## Component structure

- `components/layout/` — `IdeNavigation`, `FileExplorerSidebar`, `IdeStatusFooter`: these render
  fixed/sticky/static chrome around `<main>` in `app/page.tsx`. Their responsive behavior (fixed vs
  sticky vs static, shown vs hidden) is the core layout requirement from the design brief — see
  each file's Tailwind classes for the exact breakpoint logic.
- `components/ui/WindowChrome.tsx` — the reusable "editor window" wrapper (colored title bar with
  `● filename` + `— □ ×` controls, bordered/shadowed body) used by Home, About/README, every
  project card, and Contact. Reuse this for any new IDE-window-styled block rather than
  reimplementing the chrome.
- `components/ui/` also has `SectionLabel` (numbered `01 LABEL` tag), `SkillChip`, `TechTag`,
  `SocialActionButton`, `Icon`.
- `components/sections/` — one component per content section (`HomeSection`, `AboutSection`,
  `SkillsSection`, `ProjectsSection` + `ProjectCard`, `ContactSection`), each taking its typed
  content slice as a prop. Static UI chrome text that isn't part of the JSON content (e.g. the
  file explorer's file list, the editor status bar text, window filenames) is hardcoded in the
  component — only content that's meant to be edited lives in `content/portfolio.json`.

## Known deviations from pixel-exact Figma values

- Some very small mobile text sizes in Figma (e.g. 6px footer text) were bumped up for legibility
  (10px) rather than copied literally.
- The window-chrome border/shadow scales via Tailwind responsive classes (`shadow-[6px_6px...]`
  mobile → `md:shadow-[8px_8px...]` desktop) rather than being pixel-matched to every intermediate
  Figma measurement — this was confirmed correct against two sampled Figma nodes (mobile + desktop
  README windows) and applied consistently elsewhere.
- YouTube, LinkedIn (nav/contact context), and the file-explorer social icons that were Figma
  Code-Connect design-system components (not literal SVG exports) were recreated as regular SVGs
  rather than downloaded, since no literal asset existed to fetch.

## Verification performed

- `npx tsc --noEmit` — no type errors
- `npx next build` — production build succeeds
- Visually verified in a real browser against the Figma screenshots at both 1440px (desktop, full
  sidebar/fixed nav+footer) and a sub-768px width (mobile: sticky nav, no sidebar, icon-only skill
  chips, static footer) — layout, fixed/sticky behavior, and content all matched.
