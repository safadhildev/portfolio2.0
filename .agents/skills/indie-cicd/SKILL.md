---
name: indie-cicd
description: >
  CI/CD pipeline and publish playbook. Use when setting up or fixing a build/test/deploy pipeline, or a
  publish flow (npm, Docker, app store/Play Store). Covers pipeline security and mobile release safety.
---

# CI/CD and publish playbook

## Stack detection

Confirm the CI provider already in use (GitHub Actions, GitLab CI, CircleCI, etc.) and the existing
pipeline structure before adding a new one — extend, don't fork a second pipeline system.

## Pipeline security (highest-signal pitfalls)

- **Short-lived credentials over static secrets** — use OIDC/workload identity federation to fetch
  secrets at runtime where the provider supports it, instead of long-lived tokens sitting in CI config.
- **Pin third-party Actions/base images to a commit SHA or content digest**, never a mutable tag —
  a mutable tag can be repointed to malicious content after the fact.
- **Default to read-only tokens**; grant write scope per-job only where genuinely needed.
- **Never run untrusted fork PR code with privileged/base-repo secrets** — a `pull_request_target`
  trigger that checks out and executes fork code with base-repo secrets is a classic pipeline-poisoning
  vector.
- Treat staging/non-prod environments with the same care as production — they often hold
  production-like data or have weaker network restrictions.
- Never store secrets as plain env vars in a way that gets echoed to logs; use the provider's secret
  masking.

## Pipeline structure

Build → lint → typecheck → test → (SBOM/dependency scan) → deploy/publish. Fail fast on the cheapest
checks first (lint/typecheck) before running slower test/build steps.

## Mobile release (App Store / Play Store)

- **Version/build numbers generated deterministically in CI** — never from a gitignored local counter
  or a spreadsheet; these don't survive a fresh CI runner and cause silent version drift. Google Play's
  `versionCode` must strictly increase across every track, not just per-track.
- **Verify the expected signing-key fingerprint as a preflight check** before a release build — a
  perfectly valid build gets rejected if its signature doesn't match what the store has been told to trust.
- Store signing keys/credentials in the CI's secret store, never on a single developer's laptop or
  shared over chat.
- Tools: EAS (Expo-managed apps) or Fastlane (native/bare) — note Fastlane's `supply` action needs at
  least one manually-uploaded prior version on Google Play before it can automate further updates.
- Watch EAS free-tier build limits if relying on it mid-sprint; don't fall back to running builds on a
  developer laptop as a habit.

## Verification

Lint the workflow file itself; confirm no plaintext secret is introduced; for a new pipeline, run it on
a throwaway branch/PR before wiring it to the default branch or a real release track.
