# ADR 0001: Modular monolith on Cloudflare Workers / OpenNext

- **Status:** Accepted
- **Date:** 2026-07-28
- **Deciders:** Architecture / engineering
- **Related:** [0002](./0002-cloudflare-postgres-topology.md), [system map](../system-map.md)

## Context

DealerHire needs versioned listings, policy gates, durable intake, command/actuation ledgers, tenant isolation, and compliance evidence in one product. Premature microservices would multiply deployables, contracts, and failure modes before product-market fit and counsel-approved beta scope exist.

The reconciled architecture treats the flow chart as a conceptual control/evidence model, not a service inventory.

## Decision

Build **one repository, one TypeScript package, one PostgreSQL database**, and a **modular monolith** with a small number of runtime entrypoints:

| Deployable | Role |
| --- | --- |
| `platform-web` | Next.js App Router via OpenNext on Cloudflare Workers — public pages + authenticated control plane |
| `intake-api` | Native Worker for applications/resume upload; independent of Next.js and control-plane DB request path |
| `backplane` | Queues, workflows, webhooks, imports, parsing, embeddings, notifications, adapters |
| `copilot-mcp` | Deferred post-pilot; authenticated remote MCP calling the command layer through service binding |

Domain modules own data and transitions. Cloudflare deployables exist only where availability, security, or async execution requires isolation.

### Hard floors

- PostgreSQL is the authoritative transactional system. R2, queues, analytics files, and vector indexes are projections or durable intake buffers.
- Deterministic policy gates control legality, authorization, spend, publication, and state transitions. AI may extract, draft, explain, and recommend; it may not certify compliance, silently publish, auto-reject, or directly mutate ad platforms.
- Every consequential artifact is versioned and attributable.
- Do not create controller, policy-arbiter, sensor, observation-ledger, PII-vault, model-registry, release-gate, or purpose-plane **services**. Implement them as domain functions, tables, constraints, scoped roles, read models, and backplane jobs.

## Consequences

- Shared domain layer and SQL migrations across Workers.
- Clear module boundaries without empty package scaffolding.
- Extraction (e.g. Vectorize, split public/auth Workers) only after measured thresholds—see ADR 0002 and 0010.
- Ponytail and founder-literacy governance optimize inside correctness/security/privacy floors; they do not authorize removing guards.

## Alternatives considered

| Alternative | Why rejected |
| --- | --- |
| Microservices per bounded context | Premature operational cost; chart boxes are records/functions, not services |
| Full event-sourcing / CQRS platform | Overbuilds evidence needs; observation trail is lightweight, not a second SoT |
| Separate DBs per purpose plane | Purpose planes are schemas/roles/policies in one deployment |
| Queue-per-arrow topology | Start with `applicant-ingest`, `compute`, `integrations` (+ DLQs) |

## Beta envelope

One NY dealer group/rooftop, English managed subdomain, all dealership role families deeply validated before live traffic. Defer: ATS replacement, marketplace, live ad actuation, Spanish, custom domains, SMS, cross-tenant intelligence, Vectorize, active-active Postgres.
