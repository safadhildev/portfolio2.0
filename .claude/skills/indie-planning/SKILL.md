---
name: indie-planning
description: >
  Prioritization and estimation playbook for solo/indie project planning. Use when breaking a backlog
  or feature request into a prioritized, sequenced, estimated task list.
---

# Indie planning playbook

## Prioritization frameworks (pick one, say which)

- **MoSCoW** — Must / Should / Could / Won't-this-time. Good for a deadline-bound scope cut.
- **RICE** — Reach × Impact × Confidence / Effort. Good for comparing independent feature candidates.

## Estimation

- Ranges, not single numbers: "2-4 days," not "18 hours."
- State confidence: high (done this before, small surface) vs low (new territory, unclear scope).
- Re-estimate out loud when new information changes the picture — don't silently keep a stale number.

## Sequencing

- Put anything that gates other work first (a schema decision, a design-system choice, an API contract).
- Mark what can run in parallel (independent FE/BE slices once a contract is fixed) vs what's serial.
- Every task gets an owner agent: `indie-sa` (design), `indie-fe`/`indie-be` (implement), `indie-qa` (verify).

## Definition of done

State per milestone, not just per task — what does "this phase is shippable" verifiably mean (tests
pass, manual golden path works, no open Critical/High review finding).

## Anti-patterns

- False-precision estimates that hide real uncertainty.
- A flat task list with no dependency order.
- Absorbing scope creep into an existing estimate instead of flagging it as new scope.
