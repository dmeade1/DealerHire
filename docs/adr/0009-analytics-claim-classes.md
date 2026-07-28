# ADR 0009: Analytics claim classes and tenant-local beta scope

- **Status:** Accepted
- **Date:** 2026-07-28
- **Deciders:** Architecture / engineering
- **Related:** [0006](./0006-command-outbox-actuation.md), [0007](./0007-candidate-ai-shadow-mode.md), [data inventory](../data-inventory.md)

## Context

Hiring analytics easily overclaim causation from attribution or manager preference. Cross-tenant benchmarks create competition, disclosure, and contractual risks. The beta needs comprehensive operational visibility without unsafe learning loops.

## Decision

### Claim classes

Every analytical output is labeled one of:

| Class | Beta allowed? | Meaning |
| --- | --- | --- |
| Rule-based | Yes | Deterministic policy/audit findings |
| Operational | Yes | Fresh allowlisted receipt/delivery/backlog health |
| Descriptive | Yes | Reconciled accounting (“associated with” / “allocated to”) |
| Predictive | No (beta) | Forecasts require separate release controls |
| Causal | No (beta) | Requires registered `AnalysisContract` + confirmed actuation |

- Attribution and manager preference are **not** causation.
- Without an `AnalysisContract` (eligible population, identification strategy, confirmed `ActuationReceipt`, comparison boundaries, mature outcome window, estimator, missingness treatment, owner, approval), never say “lift,” “caused,” or “effect.”

### Evidence tiers

1. **Fast / operational:** Fresh, allowlisted, tenant-local telemetry may support TTL-bounded operational advice; never model learning or cross-tenant conclusions.
2. **Slow / governed:** Effect-bearing models, benchmarks, or market advice require admission, qualification, release, and disclosure-at-use.

Advisory **abstention** (missing/stale/uncertain/disclosure-unsafe) ≠ active **halt** (expired auth, broken delivery, budget breach, stale safety-critical state).

### Beta analytics contract

- Comprehensive across listing, campaign, funnel, recruiter ops, compliance, quality, and platform reliability.
- **Tenant-local**, role-scoped, operational or descriptive only.
- Operational health may be near-real-time; business/funnel reporting hourly or daily **after reconciliation**.
- **No dealer-facing or internal cross-tenant first-party benchmarks** in beta.
- Human qualification, disposition, hire, and attribution outputs are **report-only** and cannot feed campaign advice or candidate processing during beta.
- Qualified hire = dealer-confirmed versioned qualification rubric **and** confirmed start.
- Default clock: `JobControlVersion` approval → confirmed start.
- Default cost: attributable ad spend + explicitly allocated campaign-service cost.
- Optional Y90 is a delayed supervisory outcome for **future aggregate** analysis only—never a candidate-level feature or current control input.

### Mission vs setpoints

The mission (better labor intelligence/hiring outcomes) is orientation, not a numeric setpoint. Each `JobControlVersion` carries separate measurable references; there is no universal optimization score.

## Consequences

- Learning tests prove preference/attribution/unconfirmed commands cannot create causal claims.
- Cross-tenant intelligence requires Phase 4 disclosure controls + counsel + contracts.

## Alternatives considered

| Alternative | Why rejected |
| --- | --- |
| Cross-tenant benchmarks in beta | Disclosure/competition/contract risk |
| Causal language from CSV attribution | Unconfirmed actuation; confounding |
| Feeding hire outcomes into candidate ranking | Feedback loop into employment decisions |
| Single optimization score | Collapses conflicting job references |
