---
name: indie-backend-node-ts
description: >
  Node.js / TypeScript backend implementation playbook. Use for building or fixing APIs, services, and
  data layers in a Node/TS backend — validation, auth boundaries, and common security pitfalls.
---

# Node.js / TypeScript backend playbook

## Stack detection

Confirm before assuming: framework (Express/Fastify/Nest/Hono/tRPC), ORM (Prisma/Drizzle/TypeORM/raw
SQL), validation library already in use (Zod/Joi/class-validator), and the existing auth pattern.

## Layering

Route/controller → service (business logic) → data-access (ORM/query layer). Routes parse+validate+
delegate; they don't contain business logic themselves.

## Validation (highest-signal pitfall)

- Schema-validate every request body/param/header at the boundary — `.parse()`/`.safeParse()` before
  the value reaches a service or DB call. An unvalidated `req.body` reaching a query or logic layer is
  the single most common source of both bugs and injection risk.
- Never build a query with string concatenation/template strings on user input — use parameterized
  queries or an ORM that escapes automatically.

## Auth & secrets

- Never compare secrets/tokens with `===` — string comparison is not constant-time; use
  `crypto.timingSafeEqual`.
- Secrets live in env vars/secret managers, never in source or logs.
- Never use `eval()`, `new Function()`, or `child_process.exec()`/`execSync` with unsanitized input —
  these are direct remote-code-execution vectors.

## Dependencies

- Lock dependencies (`package-lock.json`, `npm ci` in CI — not `npm install`).
- Audit and update regularly; supply-chain compromise is a leading source of Node security incidents.

## Enums / discriminated unions

Any closed enum or discriminated union driving branching business logic gets exhaustive handling
(`switch` with a `never`-typed default), never an implicit final `else`.

## Verification

The project's own test/typecheck/lint commands. For anything touching auth/validation, add or confirm
a test per failure mode (missing field, wrong type, unauthorized), not just the happy path.
