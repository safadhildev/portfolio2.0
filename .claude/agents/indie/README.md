# Indie Dev Team — Claude Code Agents

User-scoped, **project-agnostic** agents for solo/indie software work across any repo: web
(React/Next.js), mobile (React Native/Expo), and backend (Node/TypeScript, Kotlin/Java, Python).
Unlike the `allocate2.0/` set, this team does not assume one company's monorepo — every agent
detects the target repo's actual stack/tooling first and adapts to it.

## Agents

| File | `name` | Role |
|------|--------|------|
| `pm.md` | `indie-pm` | Prioritizes work, estimates effort, builds a timeline, sequences hand-offs |
| `solution-architect.md` | `indie-sa` | Studies requirements, produces a technical blueprint (plan-only) |
| `frontend.md` | `indie-fe` | Senior React/Next.js/React Native + UI/UX implementer |
| `backend.md` | `indie-be` | Senior backend implementer (Node/TS, Kotlin/Java, Python) + CI/CD + publish |
| `qa.md` | `indie-qa` | Tests the app after changes; produces a test-case/outcome report |
| `review.md` | `indie-review` | Reviews diffs with a senior-engineer rubric; approve/request-changes |

Identity comes from the YAML `name` field. Claude Code scans `~/.claude/agents/` recursively, so
this subfolder is valid regardless of folder name.

## Souls & skills

**Soul** = who the agent is (identity, voice, values, refusals) — `souls/*.SOUL.md`, human-editable.
**Skill** = how they work (playbooks preloaded via agent `skills:` frontmatter) — `~/.claude/skills/`.

| Agent | Soul file |
|-------|-----------|
| `indie-pm` | `souls/indie-pm.SOUL.md` |
| `indie-sa` | `souls/indie-sa.SOUL.md` |
| `indie-fe` | `souls/indie-fe.SOUL.md` |
| `indie-be` | `souls/indie-be.SOUL.md` |
| `indie-qa` | `souls/indie-qa.SOUL.md` |
| `indie-review` | `souls/indie-review.SOUL.md` |

### Skills (`~/.claude/skills/`)

| Skill | Used by | Purpose |
|-------|---------|---------|
| `indie-planning` | pm | Prioritization (RICE/MoSCoW), estimation, timeline shape |
| `indie-architect-blueprint` | sa | Blueprint format, reuse-first, contract-first design |
| `indie-react-native` | fe | Expo/RN playbook + performance & platform-parity pitfalls |
| `indie-web-frontend` | fe | React/Next.js/TS playbook + rendering/data pitfalls |
| `indie-uiux` | fe, sa | UI/UX heuristics, accessibility, design-system consistency |
| `indie-backend-node-ts` | be | Node/TS API/service playbook + pitfalls |
| `indie-backend-jvm-python` | be | Kotlin/Java (Spring/Ktor) + Python (FastAPI/Django) playbook |
| `indie-cicd` | be, review | CI/CD pipeline + app-store/play-store/npm/docker publish playbook |
| `indie-tdd` | qa | Cross-stack test strategy + test-case/outcome reporting format |
| `indie-compat-gates` | all | Shared "definition of done" gate checklist |

### Mapping

```
indie-pm      → indie-planning
indie-sa      → indie-architect-blueprint, indie-uiux, indie-compat-gates
indie-fe      → indie-react-native, indie-web-frontend, indie-uiux, indie-compat-gates
indie-be      → indie-backend-node-ts, indie-backend-jvm-python, indie-cicd, indie-compat-gates
indie-qa      → indie-tdd, indie-compat-gates
indie-review  → (no preload — reads the target repo's own conventions ad hoc)
```

## How these were designed

1. **Mirror a proven pattern** — same conventions as `~/.claude/agents/allocate2.0/`, generalized to
   drop repo-specific assumptions (Turborepo/tRPC/Prisma/CASL) in favor of stack-detection.
2. **Senior generalist persona** — React Native, ReactJS, Next.js, TypeScript/JavaScript, UI/UX
   design, plus Kotlin/Java/Python/Node backend, full setup-to-publish delivery, and CI/CD ownership.
3. **Split by lifecycle** — PM sequences → SA designs → FE/BE implement → QA verifies → Review gates.
4. **Detect, don't dictate** — every implementer agent reads the repo's actual package manager, test
   runner, linter, and CI provider before proposing anything, and defers to what's already there.
5. **Research-seeded pitfalls** — since this is a fresh team with no incident history, `MISTAKES.md`
   is seeded from 2026 industry research (React Native/Next.js/Node/Kotlin/Python/CI-CD/UI-UX), each
   entry tagged `Source: external research` instead of a real incident.

## Recommended workflow (strict order)

```
1. indie-pm      → prioritized task list, estimates, timeline, dependency order
2. indie-sa      → blueprint (stack decisions, contracts, reuse map, FE/BE slice map, risks)
3. indie-fe      → implement UI/mobile slice only, if blueprint marks it needed
4. indie-be      → implement API/service/CI-CD slice only, if blueprint marks it needed
5. indie-qa      → test plan + test-case matrix with real outcomes; bug list if anything fails
5a. Ask before committing — stop and ask the user whether to run indie-review on each slice
    before staging/committing it. A green build/test run is not a substitute for review.
6. indie-review  → approve / request changes; loop back to indie-fe/indie-be on findings
7. Repeat 5-6 until indie-qa passes and indie-review approves, then commit/PR.
```

Skip step 3 or 4 when the blueprint marks that slice not needed. `indie-pm` and `indie-sa` never
touch code (`tools`/`disallowedTools` enforce this) — they only plan.

## Stack cheat sheet (defaults — always confirm against the actual repo first)

- **Web:** React 19 + Next.js App Router; TypeScript first; Tailwind or the repo's existing system
- **Mobile:** React Native + Expo, New Architecture + Hermes (default since RN 0.76+); FlashList over
  FlatList for large lists
- **Backend (TS):** Node.js + a validation library (Zod/Joi) at every trust boundary
- **Backend (JVM):** Kotlin + Spring Boot (coroutines/WebFlux) or Java + Spring; data classes for DTOs
- **Backend (Python):** FastAPI for async/AI workloads; Django for full product shells with sync ORM
  needs — don't force either into the other's sweet spot
- **CI/CD:** GitHub Actions (or repo's existing provider); OIDC over long-lived secrets; pin
  actions/images to SHAs; SBOM on release builds
- **Mobile release:** EAS (Expo) or Fastlane; version/build numbers generated in CI, never a
  gitignored local counter; pin the expected signing-key fingerprint as a preflight check

## Maintenance

- Update agent bodies as the researched pitfalls age out or the user's own real incidents accumulate
  in `MISTAKES.md` (same append-only format, but now with real `Agent/skill involved` entries).
- Keep `name` values unique under `~/.claude/agents/` (no collision with `local-allocate-*`).
- After first creation of a new `~/.claude/agents/` subfolder, restart Claude Code (or run `/doctor`)
  if agents are missing; later edits hot-reload.
