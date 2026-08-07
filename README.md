# DealerHire

Automotive labor intelligence platform — Cloudflare-hosted modular monolith with PostgreSQL authority.

## Current program status

| Gate | Status |
| --- | --- |
| G0 Implementation-ready | Partial — synthetic partner + docs complete; **live NY partner not selected** |
| G1 No-PII skeleton | **Conditional** — G1-04 live R2 Waived (2026-08-07); owner sign-off G1-15/16 still open |
| G2 Live-PII | Foundation code present; closed to live applicants until evidence pack passes |
| G3 Beta | Blocked on live partner + **all role-family acceptance** |
| Candidate AI | **Shadow-only** |
| Ad actuation | **Disabled** |

Architecture contract: see internal planning docs. Repository decisions live in [`docs/`](docs/).

## Stack

- TypeScript / Next.js App Router
- Cloudflare Workers entrypoints: `platform-web`, `intake-api`, `backplane`
- Managed PostgreSQL + Hyperdrive (query cache off for canonical state)
- pnpm, Vitest, GitHub Actions CI

## Quick start

```bash
pnpm install
pnpm test
pnpm db:migrate:check
pnpm dev
```

Optional with local Postgres (`docker-compose.yml` via `pnpm db:up`, Docker/Colima):

```bash
cp .env.example .env
pnpm db:up               # compose when available; else docker run dealerhire-pg
pnpm db:migrate          # uses DATABASE_URL_ADMIN
pnpm db:seed
pnpm test:integration    # G1-03 RLS proofs via dealerhire_app (NOBYPASSRLS)
```

Ops CLI (loads `.env` automatically):

```bash
pnpm ops health
pnpm ops publish:demo   # SYNTHETIC G1-04 PageRelease → /jobs/demo
pnpm ops roles
pnpm ops liveness
pnpm ops kill-switch:status
pnpm ops outbox:inspect --limit 20
# Mutations require OPS_CONTROL_SECRET + signed actor (--break-glass emergency only):
pnpm ops kill-switch --scope intake --reason "SYNTHETIC drill" --actor-token … --actor-sig …
```

Publication walkthrough: [`docs/gates/g1-04-publication-runbook.md`](docs/gates/g1-04-publication-runbook.md).  
Recovery walkthrough: [`docs/gates/g1-ops-demo-script.md`](docs/gates/g1-ops-demo-script.md).

Liveness: `GET /healthz` (Next) and Worker `GET /health` (preview stubs).

## Repository layout

- `src/app/` — Next.js routes (public jobs, dealer control plane, ops)
- `src/modules/` — active domain slices
- `src/platform/` — db, auth context, crypto
- `src/workers/` — intake, backplane, platform-web
- `db/migrations/` — SQL-first, FORCE RLS
- `docs/` — partners, UX, ADRs, gates, roles, assurance
- `.cursor/rules/ponytail.mdc` — minimalism inside hard floors
- `.cursor/skills/founder-literacy/` — founder literacy skill
- `.cursor/skills/ponytail-program/` — continuous program goal: `/loop` + `@.cursor/skills/ponytail-program/GOAL.md`

## Auth (local G1)

Dealer and ops App Router trees require a signed actor (`x-dh-actor` + `x-dh-actor-sig` HMAC with `CAPABILITY_SECRET`) and page-level capabilities. `DH_AUTH_MODE=hmac-g1` is the local default; production defaults to `idp` and fails closed until an IdP is Selected/wired. For local skeleton browsing only, set `ALLOW_UNSIGNED_SYNTHETIC_ACTOR=true` (ignored in production). Kill-switch HTTP (Next + backplane) requires `OPS_CONTROL_SECRET` plus a signed ops actor; CLI matches that contract (or audited `--break-glass`).

## Non-negotiables

- Application receipt = `ApplicationAcceptanceEnvelope` conditional insert only
- Forced tenant/rooftop/purpose isolation
- Candidate AI shadow-only until `EmploymentAIUse` gate
- No live ad API actuation in beta
- Approved min/max pay range required for every published role
- All dealership role families accepted before live beta
