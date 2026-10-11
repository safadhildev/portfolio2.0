---
name: indie-uiux
description: >
  UI/UX design heuristics and accessibility checklist. Use when designing or reviewing any user-facing
  screen, web or mobile — accessibility, Nielsen heuristics, and design-system consistency.
---

# UI/UX playbook

## Core heuristics (Nielsen, still the baseline)

- Visibility of system status — always show loading/progress, never a silent freeze.
- Error prevention over error messages — constrain input where possible instead of just validating after.
- Consistency — match existing patterns in the app rather than inventing a new interaction for the same concept.
- Aesthetic and minimalist design — no irrelevant or rarely-needed information competing for attention.
- User control — provide an obvious way to undo/cancel/go back.

## Accessibility (WCAG POUR, baked into design, not a final pass)

- **Perceivable** — sufficient contrast (text vs background), alt text on meaningful images, don't
  convey information by color alone.
- **Operable** — every interactive element reachable and usable by keyboard alone; visible focus states;
  adequate touch target size on mobile (~44x44pt).
- **Understandable** — clear labels on inputs/buttons, predictable navigation, helpful (not generic)
  error messages.
- **Robust** — semantic elements/roles so assistive tech (screen readers) can interpret the UI correctly.

## Practical checklist for any user-facing surface

- [ ] Contrast passes for text and meaningful icons in every state (default/hover/disabled)
- [ ] Every interactive element has a visible focus state and is keyboard-reachable
- [ ] Loading, empty, and error states are designed, not just the happy path
- [ ] Labels/alt text present on inputs, images, and icon-only buttons
- [ ] No information conveyed by color alone
- [ ] Design matches the app's existing component/spacing/typography system

## Anti-pattern

Treating accessibility as a QA-stage checklist item instead of a design input — it costs far less to
build in from the start than to retrofit after the UI ships.

## Applies to

`indie-sa` (bakes these into acceptance criteria for user-facing work) and `indie-fe` (implements
against this checklist); `indie-review` and `indie-qa` verify against it.
