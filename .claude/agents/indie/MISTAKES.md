# Indie agent/skill mistake log

Append-only. One entry per incident where a review finding, a wrong FE/BE decision, or a blocked/
confused run traced back to a gap in one of these agent or skill files — plus, since this team is
new, a seed batch of entries distilled from external 2026 industry research instead of a lived
incident (marked `Source:` instead of `Agent/skill involved` root-caused-from-a-run). When a real
incident happens, fix the gap in the actual `.md` file first, then log it here so the change has a
paper trail on a dotfile directory with no git history of its own.

Format per real incident:

```
## YYYY-MM-DD — <short title>
- Agent/skill involved: <file>
- What went wrong: <symptom, one or two sentences>
- Root cause: <the actual gap in the instructions>
- Fix applied: <what changed in the agent/skill file, with the section name>
- Rule going forward: <one line>
```

Format per seeded research entry:

```
## SEED — <short title>
- Source: <what/where this pattern is documented, no fabricated URL>
- Pattern: <the mistake, in concrete terms>
- Fix applied: <what rule this became, and in which agent/skill file>
- Rule going forward: <one line>
```

---

## SEED — Unnecessary re-renders and .map()-built lists in React Native

- Source: 2026 React Native performance guides (Callstack, community best-practice roundups)
- Pattern: Rendering large lists with `.map()` instead of a virtualized list component, and passing
  inline arrow functions as props in JSX, both cause unbounded re-renders and dropped frames on
  low-end devices — invisible on a dev machine, painful on real hardware.
- Fix applied: `indie-react-native` skill requires FlashList (or FlatList at minimum) for any list
  over ~20 items, `React.memo` on pure list-item components, and stable callback references
  (`useCallback` / hoisted functions) for anything passed into a virtualized list.
- Rule going forward: any RN screen rendering a list from an array must use a virtualized list
  component and stable prop references — a plain `.map()` over user/API data is a review finding.

## SEED — Hermes/New Architecture left disabled after an RN upgrade

- Source: 2026 React Native upgrade retrospectives
- Pattern: Teams bump the React Native version but forget to re-toggle Hermes/New Architecture flags
  in `ios/Podfile` or `android/gradle.properties` after native config regenerates, silently running
  the old bridge/JS engine and losing the upgrade's performance benefit.
- Fix applied: `indie-react-native` skill's upgrade checklist explicitly re-verifies Hermes + New
  Architecture flags after any RN version bump or `expo prebuild`/native regeneration.
- Rule going forward: an RN version bump is not done until the native config flags are confirmed,
  not assumed carried over.

## SEED — Hydration mismatches from client-only values rendered on the server

- Source: 2026 Next.js App Router hydration-error postmortems
- Pattern: Formatting dates/times without pinning a timezone, or reading `window`/`document` during
  render instead of in an effect, produces different server vs. client output and a hydration error
  — often intermittent, hard to repro on `next dev`.
- Fix applied: `indie-web-frontend` skill requires: no browser-only API access during render (move to
  `useEffect` or mark `use client` deliberately), explicit timezone/locale for any server-rendered
  date/time, and a CI smoke check that runs a production build (`next build && next start`) rather
  than trusting dev-mode behavior alone.
- Rule going forward: any date/time or environment-dependent value rendered on the server must be
  deterministic across server and client, or deferred to a client-only effect.

## SEED — Blocking calls inside `async def` routes freeze the whole event loop

- Source: 2026 FastAPI/asyncio production-practice guides
- Pattern: An `async def` endpoint that calls a synchronous/blocking library (sync DB driver, CPU-bound
  work, blocking file I/O) blocks the single event loop for every concurrent request, not just its own.
- Fix applied: `indie-backend-jvm-python` skill requires async-native drivers (async SQLAlchemy, etc.)
  behind any `async def` route, and offloading CPU-bound or blocking work to a task queue (Celery/Arq)
  or a thread pool — never inline in the handler.
- Rule going forward: before marking a Python route `async def`, confirm every call inside it is
  actually non-blocking; if not, either make the route sync or move the blocking call off the event loop.

## SEED — Timing-unsafe token comparison and unvalidated request bodies

- Source: 2026 Node.js security best-practice roundups (OWASP-aligned)
- Pattern: Comparing secrets/tokens with `===` is vulnerable to timing attacks; passing `req.body`
  straight into a query or business logic with no schema validation invites injection and mass
  assignment.
- Fix applied: `indie-backend-node-ts` skill requires constant-time comparison (`crypto.timingSafeEqual`)
  for any secret/token check, and a schema (Zod/Joi) `.parse()` at every external input boundary before
  the value reaches a service or database layer.
- Rule going forward: no endpoint accepts a body/param without a schema parse; no secret comparison
  uses `===`.

## SEED — Secrets and long-lived credentials leaking through CI/CD

- Source: 2026 CI/CD security checklists (secrets management, poisoned pipeline execution patterns)
- Pattern: Long-lived static secrets in CI env vars/history, unpinned third-party Actions/base images
  (mutable tags), and workflows triggered by `pull_request_target` that run untrusted fork code with
  privileged secrets, are recurring causes of pipeline compromise.
- Fix applied: `indie-cicd` skill requires OIDC/short-lived credentials over static secrets, pinning
  Actions/images to commit SHAs or digests, read-only tokens by default with per-job write scope only
  when needed, and never running fork PR code with base-repo secrets.
- Rule going forward: any new workflow is reviewed for secret lifetime, pinned dependencies, and
  whether it ever runs untrusted (fork) code with privileged context.

## SEED — Version drift and signing mismatches in mobile release pipelines

- Source: 2026 Play Store/App Store CI automation retrospectives
- Pattern: A gitignored local counter or spreadsheet deciding version/build numbers doesn't survive a
  fresh CI runner and silently ships wrong version codes; a mismatched signing key gets a valid build
  rejected by the store.
- Fix applied: `indie-cicd` skill requires version/build numbers generated deterministically in CI
  (not a local file), and a preflight check that pins/verifies the expected signing-key fingerprint
  before a release build is attempted.
- Rule going forward: mobile release automation must not depend on any machine-local state; signing
  identity is verified before build, not discovered after a store rejection.

## SEED — Accessibility treated as a final QA pass instead of a design input

- Source: 2026 UI/UX accessibility guides (WCAG POUR principles, Nielsen heuristics)
- Pattern: Contrast, keyboard operability, and screen-reader support get checked (if at all) after the
  UI is built, producing costly rework versus designing them in from the start.
- Fix applied: `indie-uiux` skill bakes contrast/keyboard/labeling requirements into the design
  checklist `indie-sa` and `indie-fe` both apply, not just into a QA-stage checklist.
- Rule going forward: any user-facing screen's acceptance criteria include contrast, keyboard, and
  screen-reader basics — not deferred to a later "accessibility pass."
