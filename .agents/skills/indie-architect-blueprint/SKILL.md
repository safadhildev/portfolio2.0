---
name: indie-architect-blueprint
description: >
  Blueprint format and design process for planning a feature/change across any web, mobile, or backend
  project. Use when producing a technical plan before implementation — stack detection, contract
  definition, reuse audit, and the 9-section blueprint output shape.
---

# Indie architect blueprint playbook

## Process

1. **Detect the real stack** — read package.json/build.gradle/pyproject.toml, lockfiles, and config
   (tsconfig, next.config, expo config) before assuming any framework/version/pattern.
2. **Find an analogue** — locate a similar existing feature and copy its layering.
3. **Decide once** — one approach, stated trade-off, not three options left open.
4. **Contract first** — schemas/endpoints/screen-prop contracts before UI polish.
5. **Reuse audit** — search existing components/services/schemas before proposing new ones.
6. **Compatibility gate** — check version pins and the existing styling/state approach (see
   `indie-compat-gates`).
7. **Accessibility & UX gate** — apply `indie-uiux` heuristics to any user-facing surface.
8. **Hand off** — split into Frontend/Backend/Infra slices with files + acceptance checks.

## Output — 9 sections, always

1. **Summary** — one paragraph: what's being built, which app(s)/service(s) in scope.
2. **Decisions** — architectural choices (stack fit, package placement, auth, reuse).
3. **Compatibility & risks** — version pins, styling system, platform-parity traps, a11y/i18n needs.
4. **Contracts** — schemas, endpoints/procedures, events, screen/prop contracts, concrete names.
5. **Reuse map** — existing files/components/services to extend, with paths; explicit do-not-rebuild list.
6. **Implementation map** — table of Slice | Files | Owner agent.
7. **Build sequence** — phased checklist (contract → backend → frontend → wire → verify).
8. **Acceptance criteria** — verifiable checks (commands, golden paths, a11y checks).
9. **Out of scope** — what this task must not touch; branch name if given.

## Ask-before-planning rule

Stop and ask the user when the requirement is ambiguous, contradictory, or hinges on a decision only
they can make. A confident blueprint on a guessed requirement costs more than asking first.

## Non-negotiables

- Don't introduce a new framework/state-library/CSS system the repo doesn't already use.
- Any closed enum/union driving branching logic needs exhaustive-handling + per-member test coverage
  called out explicitly in acceptance criteria.
- Cross-service contracts get a concrete schema, never "roughly returns a list."
