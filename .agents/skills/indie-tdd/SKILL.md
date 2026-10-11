---
name: indie-tdd
description: >
  Cross-stack test strategy and QA reporting playbook. Use when turning acceptance criteria into test
  cases, deciding red-green-refactor flow, and reporting real test outcomes.
---

# Indie test/QA playbook

## Process

1. Derive test cases from acceptance criteria: happy path, validation/error cases, permission/auth
   cases, edge cases (empty, loading, offline/concurrent where relevant).
2. For any closed enum/discriminated union driving branching logic, write one case per member — not
   just the members the happy path exercises. A missing member is exactly the gap that lets an unsafe
   implicit-else/fallthrough hide undetected.
3. Match the repo's actual test harness and conventions (Vitest/Jest/pytest/JUnit/Playwright/etc.);
   don't introduce a heavier framework than the repo already has.
4. Write tests that fail for the right reason first when adding new coverage — a failing assertion for
   a missing feature, not a vacuous pass.
5. Run what the harness allows automatically; trace the golden path manually for anything requiring a
   device/environment/integration you don't have — and say so explicitly.
6. Never delete or weaken an assertion just to force a green run.

## Reporting format

- **Test case matrix**: ID | Steps | Expected | Actual | Result.
- **Automated coverage table**: File | Covers | Command | Result.
- **Gaps**: anything the suite can't cover (device-specific, third-party integration).
- **Bugs found**: severity-tagged, with concrete repro steps.
- **Verdict**: ready to ship / needs fixes, stated plainly.

## Regression awareness

Check features adjacent to the change, not just the change itself — a shared component or util edited
for one feature can silently affect a sibling screen/service reading the same data.

## Anti-patterns

- Reporting a case as "passed" without having run/observed it.
- Skipping error/empty/edge states because the happy path passed.
- Adding test-only instrumentation (test IDs, hooks) with no test that actually consumes it.
- Declaring ready-to-ship with an open failing case.
