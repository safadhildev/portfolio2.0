# Task PLAN (copy into the working repo as PLAN.md, delete after merge)

## Objective
<one sentence: what changes for the user/system>

## Branch
<branch name — indie-sa/indie-fe/indie-be must not touch files outside this scope>

## Pipeline

- [ ] 1. `indie-pm` — prioritized task list, estimate, timeline, dependency order
- [ ] 2. `indie-sa` — blueprint (stack decisions, contracts, reuse map, FE/BE slice map, risks)
- [ ] 3. `indie-fe` — frontend/mobile slice (skip if blueprint marks not needed)
- [ ] 4. `indie-be` — backend/CI-CD slice (skip if blueprint marks not needed)
- [ ] 5. `indie-qa` — test plan + test-case matrix with real outcomes
- [ ] 5a. Ask user before committing each slice — is a review pass wanted first?
- [ ] 6. `indie-review` — approve / request changes
- [ ] 6a. If findings: loop back to `indie-fe`/`indie-be` for fixes, re-run 5-6
- [ ] 7. Commit / PR

## Acceptance criteria
<verifiable checks from the blueprint / PM's definition of done>

## Out of scope
<explicitly excluded work>
