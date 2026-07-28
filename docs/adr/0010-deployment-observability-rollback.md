# ADR 0010: Deployment, observability, and rollback model

- **Status:** Accepted
- **Date:** 2026-07-28
- **Deciders:** Architecture / engineering
- **Related:** [slos.md](../slos.md), [recovery-criteria.md](../recovery-criteria.md), [0002](./0002-cloudflare-postgres-topology.md)

## Context

Cloudflare Worker rollback is **code-only**. Schema, messages, publication manifests, provider effects, and envelopes require explicit compensation. Observability must not write applicant PII into immutable logs. Beta support is business-hours with emergency kill switches—not implied 24/7 staffing.

## Decision

### Deployment

- One package, multiple Worker entrypoints with checked-in per-Worker configuration (`wrangler` configs).
- CI emits SBOM, build digest/provenance, SAST/dependency/secret results, migration compatibility, and tested rollback target.
- Maintain N/N−1 schema and message compatibility; Workflow versioning; release affinity where needed.
- Split public vs authenticated web Workers before claiming different contractual SLOs or when blast radius/bundle/release cadence justifies it.

### Observability

- Structured logs/traces with correlation and causation IDs; **no applicant PII** in immutable logs.
- Independent synthetic intake probes; error-budget alerts; queue/DLQ age; Hyperdrive pool; provider drift; spend anomaly monitoring.
- Source-specific liveness: `Fresh`, `ObservedZero`, `Missing`, `Stale`.
- Business actuation receipts are domain evidence—never inferred from infrastructure logs.
- Secrets in GA Worker secrets initially (do not assume beta Secrets Store capabilities).

### Rollback and recovery

| Layer | Rollback / recovery |
| --- | --- |
| Worker code | Cloudflare rollback to previous version |
| Schema | Forward-safe migrations; N/N−1; expand/contract |
| Publication | `PageRelease` pointer to previous manifest |
| Intake | Replay from acceptance envelope |
| Commands | Outbox/inbox replay; `NeedsReconciliation`; never blind recreate |
| Provider effects | Explicit compensation procedures |
| Database | Managed multi-AZ failover; PITR; audited restore drills |

- Audited operator CLI / minimal ops page ships before live traffic: inspect, provider/source read-back, DLQ/outbox replay, reconciliation, safe retry.
- Recovery **never** requires direct database edits.
- Always-available intake/campaign **kill switches** plus escalation path.
- SOC 2 / ISO 27001 control mapping from inception; Type I before broad launch.

### Reliability posture

- 99.99% public page + durable structured receipt is an **engineering target**, not a contractual beta promise (see [slos.md](../slos.md)).
- Target RPO/RTO after drills: multi-AZ RPO 0 / RTO ≤10 min; cross-region (when provisioned) RPO ≤5 min / RTO ≤60 min.
- 35-day PITR target; encrypted daily backup; independent off-platform copy; quarterly restore/failover drills.

## Consequences

- Release checklists must include code + data + publication + provider compensation owners.
- G1 requires restore/replay/rollback evidence on synthetic data before live PII.

## Alternatives considered

| Alternative | Why rejected |
| --- | --- |
| Treating Worker rollback as full product rollback | Leaves schema/provider/publication drift |
| PII in logs “for debugging” | Irreversible retention / rights conflict |
| 24/7 staffed ops implied by marketing | Not beta reality |
| Active-active Postgres | Complexity; defer |
