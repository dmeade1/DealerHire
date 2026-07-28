# DealerHire

Automotive labor intelligence platform — Cloudflare-hosted modular monolith with PostgreSQL authority.

## Current program status

| Gate | Status |
| --- | --- |
| G0 Implementation-ready | Partial — synthetic partner + docs complete; **live NY partner not selected** |
| G1 No-PII skeleton | In progress in this repo (domain modules, schema, UI shells, unit tests) |
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

Optional with local Postgres:

```bash
cp .env.example .env
# set DATABASE_URL
pnpm db:migrate
```

Ops CLI:

```bash
pnpm ops health
pnpm ops roles
pnpm ops kill-switch
```

## Repository layout

- `src/app/` — Next.js routes (public jobs, dealer control plane, ops)
- `src/modules/` — active domain slices
- `src/platform/` — db, auth context, crypto
- `src/workers/` — intake, backplane, platform-web
- `db/migrations/` — SQL-first, FORCE RLS
- `docs/` — partners, UX, ADRs, gates, roles, assurance
- `.cursor/rules/ponytail.mdc` — minimalism inside hard floors
- `.cursor/skills/founder-literacy/` — founder literacy skill

## Non-negotiables

- Application receipt = `ApplicationAcceptanceEnvelope` conditional insert only
- Forced tenant/rooftop/purpose isolation
- Candidate AI shadow-only until `EmploymentAIUse` gate
- No live ad API actuation in beta
- Approved min/max pay range required for every published role
- All dealership role families accepted before live beta
