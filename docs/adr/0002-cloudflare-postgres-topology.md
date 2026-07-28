# ADR 0002: Cloudflare edge + managed Postgres/pgvector topology

- **Status:** Accepted
- **Date:** 2026-07-28
- **Deciders:** Architecture / engineering
- **Related:** [0001](./0001-modular-monolith.md), [0003](./0003-identity-and-rls.md), [provider allowlists](../provider-allowlists.md), [SLOs](../slos.md)

## Context

Public job pages need edge availability independent of the control-plane database. Authenticated dealer/operator work and canonical hiring state need strong transactional consistency, tenant isolation, and vector-capable storage without abandoning relational authority.

## Decision

### Edge and compute

- Host application edge on **Cloudflare Workers**.
- Deploy `platform-web` with **OpenNext** for Next.js App Router.
- Keep `intake-api` and `backplane` as native Workers.
- Use managed WAF, rate limits, Turnstile, Queues, Workflows (multi-step only), R2, and AI Gateway as platform primitives.
- Beta hostname: **managed platform subdomain** (English). Dealer custom domains require a later Cloudflare for SaaS gate.

### Data authority

- **Managed PostgreSQL with pgvector** is the system of record for transactional state, permissions, policy versions, commands, outbox/inbox, audit references, consent/authority, and operational reporting.
- Access Postgres from Workers through **Hyperdrive with query caching disabled** for canonical state.
- Avoid session-dependent database behavior under transaction pooling.
- Multi-AZ HA, PITR, TLS, least-privilege roles; cross-region replica is **not** a beta launch dependency—provision/drill before contractual cross-region RPO/RTO.

### Storage classes

| Class | Use |
| --- | --- |
| PostgreSQL | Current transactional state and operational reporting |
| R2 private | Resumes, private manifests, encrypted envelopes as configured, backups |
| R2 public | Published page/creative artifacts (content-addressed) |
| R2 analytics | Append-only de-identified Parquet/Iceberg projections (post-admission) |

### Vectors

- Start with **pgvector** behind a `SemanticIndex` port.
- Exact structured filters before similarity; vectors never decide legality or hiring outcomes.
- Move high-volume indexes to Cloudflare Vectorize only when tuned pgvector p95 > 250 ms at meaningful concurrency, vectors ≳ 5M, or vector CPU > 20% for two weeks.

## Consequences

- Public `PageRelease` serving can remain independent of Postgres availability (ADR 0005).
- Authenticated routes depend on Hyperdrive + Postgres health (tiered SLOs).
- Provider choice (Neon or Supabase Postgres) is tracked in provider allowlists; topology constraints remain if the vendor changes.

## Alternatives considered

| Alternative | Why rejected |
| --- | --- |
| Hyperdrive query cache on for canonical reads | Risk of stale authorization/policy/money state |
| Postgres on self-managed VMs | Operational burden vs managed HA/PITR |
| Vectorize-first | Weaker transactional tenant/deletion coupling early |
| Kafka / K8s data plane | Out of scope; Cloudflare queues + Postgres outbox suffice |
