---
name: indie-compat-gates
description: >
  Shared "definition of done" compatibility checklist used by all indie-* agents. Use to gate a plan or
  implementation against stack, security, and quality basics before calling it finished.
---

# Indie compatibility gates

Every `indie-sa`/`indie-fe`/`indie-be` plan or implementation should pass these gates before being
considered done. Fail the plan/implementation if a gate is violated without a documented, explicit
exception.

## Stack fit

- [ ] No new framework/state-library/CSS system introduced when the repo already has one for that purpose
- [ ] Package manager and lockfile match what the repo already uses (don't mix npm/yarn/pnpm)
- [ ] Naming/file-structure conventions match the surrounding code

## Types & validation

- [ ] No `any`/unchecked cast introduced to silence a type error
- [ ] Every external input (request body, param, header, queue message) is schema-validated at the boundary
- [ ] Every closed enum/discriminated union driving branching logic has exhaustive handling — no
      implicit else/fallthrough

## Security

- [ ] No secret in code, logs, or committed config
- [ ] No `===`/plain string comparison for secrets/tokens
- [ ] No string-concatenated queries on user input
- [ ] CI/CD changes use pinned dependencies and least-privilege tokens

## UI/UX (when the change touches a user-facing surface)

- [ ] Loading, empty, and error states are designed, not just the happy path
- [ ] Contrast, keyboard/focus, and basic screen-reader labeling present (see `indie-uiux`)
- [ ] No hardcoded user-facing string if the repo already has i18n set up

## Testing

- [ ] Acceptance criteria map to at least one test case (automated or documented manual check)
- [ ] No assertion weakened or deleted just to force a green run

## Process

- [ ] Ambiguous requirements were asked about, not guessed
- [ ] Out-of-scope/branch boundaries were respected
