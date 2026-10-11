---
name: indie-web-frontend
description: >
  React / Next.js implementation playbook. Use when building or fixing web UI, covering server/client
  component boundaries, hydration-mismatch prevention, and rendering-strategy fit.
---

# React / Next.js playbook

## Stack detection

Confirm before assuming: App Router vs Pages Router, rendering strategy already used per route
(SSR/SSG/ISR/client-only), data-fetching pattern (React Query/SWR/RTK Query/tRPC/plain fetch), and the
existing styling system (Tailwind, CSS Modules, styled-components, a component library).

## Hydration-mismatch prevention (highest-signal pitfall)

- Add `'use client'` only where interactivity/hooks/browser APIs are genuinely needed — not reflexively
  on every component.
- Never read `window`/`document` or generate random/time-based values during render on a
  server-rendered component; defer to `useEffect` or explicitly mark client-only.
- Any server-rendered date/time/locale-dependent output must be deterministic — pin timezone/locale, or
  defer formatting to the client.
- Canvas-heavy or browser-only third-party components need an SSR-safe fallback or a dynamic import
  with SSR disabled.
- Verify under production conditions before trusting it: `next build && next start`, not just `next dev`.

## Component layers

1. Shared/design-system package (if one exists) — check it first.
2. Sibling component already solving something similar.
3. New component, following the existing folder/naming convention.
Extract to a shared package only once genuinely reused across more than one app/route group.

## Rendering & data

- Match the existing rendering strategy per route type; don't silently switch SSR to client-only or vice versa.
- Use the app's existing data-fetching library/pattern; don't introduce a second one.
- Debounce search/filter inputs before triggering a fetch.

## React habits

- Avoid unnecessary `useEffect`/`useMemo`/`useCallback` — reach for them when profiling shows a real
  re-render cost, not reflexively.
- No conditional hook calls; keep hook dependency arrays honest.

## UI/UX

- Loading/empty/error states are part of "done," not optional polish.
- See `indie-uiux` for accessibility and design consistency.

## Verification

The project's own typecheck/lint/test commands, plus a production build+start smoke check for anything
touching rendering strategy or SSR-sensitive code.
