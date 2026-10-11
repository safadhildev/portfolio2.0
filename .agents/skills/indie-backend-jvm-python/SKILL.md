---
name: indie-backend-jvm-python
description: >
  Kotlin/Java (Spring/Ktor) and Python (FastAPI/Django) backend implementation playbook. Use for
  building or fixing APIs/services in a JVM or Python backend — async safety, idiomatic patterns, and
  common pitfalls per framework.
---

# Kotlin/Java and Python backend playbook

## Stack detection

Confirm before assuming: JVM framework (Spring Boot/Ktor) vs Python framework (FastAPI/Django/Flask),
persistence layer (JPA/Hibernate, Spring Data JDBC, SQLAlchemy, Django ORM), and whether the service is
sync or async by design.

## Kotlin / Java (Spring/Ktor)

- **JPA + Kotlin entities**: Kotlin classes are `final` by default and JPA needs a no-arg constructor
  and non-final classes to proxy — use the `kotlin-jpa`/`all-open` compiler plugins rather than manual
  workarounds. Consider Spring Data JDBC for more idiomatic Kotlin if the project allows it.
- Use `data class` for DTOs — free `equals`/`hashCode`/`toString`/`copy`, promotes immutability.
- Constructor injection with `private val` dependencies; prefer `val` over `var` everywhere.
- Don't convert working Java code to Kotlin without existing test coverage for it first.

## Python (FastAPI / Django)

- **Never block the event loop**: an `async def` route calling a synchronous DB driver, doing CPU-bound
  work, or blocking I/O freezes the entire event loop for every concurrent request, not just its own.
- Use an async-native ORM/driver (async SQLAlchemy, asyncpg, etc.) behind async routes.
- Offload CPU-bound or long-running work to a task queue (Celery, Arq, RQ) — never inline in the handler.
- FastAPI fits async/real-time/AI-inference workloads; Django fits a full product shell needing a
  mature sync ORM/admin/auth — don't force one into the other's role. A hybrid (Django for the product,
  FastAPI for an inference service) is a legitimate pattern when both needs exist.

## Shared backend hygiene (both ecosystems)

- Validate every external input at the boundary before it reaches business logic (Pydantic/DRF
  serializers for Python; Bean Validation/manual validation for JVM).
- Exhaustive handling of closed enums/sealed classes/unions driving branching logic — a `when`/`switch`
  with no unchecked fallthrough.
- Secrets via environment/secret manager, never hardcoded or logged.

## Verification

The project's own test/typecheck/lint/build commands (`pytest`/`./gradlew test`/`mvn test` as
applicable). For async Python routes, confirm no blocking call was introduced by tracing every I/O
call inside the handler.
