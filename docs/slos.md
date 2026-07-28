# SLOs

Service level objectives for DealerHire. **99.99% figures are engineering targets, not contractual beta promises.** Do not advertise a contractual four-nines intake SLA until measured end-to-end evidence supports it across DNS/TLS, Worker, abuse controls, acceptance-envelope provider, object storage, and recovery.

## Principles

- Tier SLOs by user-visible criticality and dependency ownership.
- Workers may meet high availability on an eligible plan; **R2 and Queues have lower provider SLOs**—design intake so structured acceptance does not require them for receipt.
- Error budgets drive freeze/invest decisions; they do not authorize removing security/privacy invariants.
- Beta support is **defined business hours** plus always-available kill switches—not implied 24/7 staffing.

## Availability tiers

| Tier | Scope | Engineering target | Beta contractual? |
| --- | --- | --- | --- |
| A | Public `PageRelease` page delivery | **99.99%** monthly | No |
| A | Durable structured application **receipt** (envelope conditional insert success) | **99.99%** monthly | No |
| B | Authenticated control-plane functions (authoring, approval, review UI APIs) | **99.9%** monthly | Optional, cautious |
| C | Backplane processing lag (ingest → Postgres projection) | 99% within published lag SLO (e.g. p95 < 15 min under normal load) | Internal |
| D | Dependency-specific (Meta, Google, ATS, email, SMS, labor data, model providers) | Track provider SLOs + adapter error budgets separately | Pass-through |

### SLIs (indicative)

| SLI | Measurement |
| --- | --- |
| Page success ratio | Synthetic probes + edge 2xx for release URLs excluding client errors |
| Receipt success ratio | Client-visible success only after envelope insert ACK; exclude abuse rejects |
| Control-plane success | Authenticated API 2xx/3xx excluding 4xx authz denials |
| Ingest lag | Envelope accepted_at → application projection reconciled_at |
| Probe freshness | Independent synthetic intake probe continuity |

## Latency (engineering)

| Path | Target (p95) | Notes |
| --- | --- | --- |
| Public page (cached artifact) | < 300 ms edge | Region-dependent |
| Envelope accept | < 2 s | Exclude large upload transfer time |
| Authenticated mutation | < 1 s app + DB | Exclude external providers |
| pgvector retrieval | < 250 ms before Vectorize extraction trigger | ADR 0002 threshold |

## Freshness

| Data | Freshness SLO |
| --- | --- |
| Operational health (intake, queues, DLQ, probes) | Near-real-time (seconds–minutes) |
| Business / funnel analytics | Hourly or daily **after reconciliation** |
| Campaign CSV imports | As imported; liveness states `Fresh` / `ObservedZero` / `Missing` / `Stale` |

## RPO / RTO

| Scenario | RPO | RTO | Beta dependency |
| --- | --- | --- | --- |
| Managed multi-AZ Postgres failover | **0** (sync HA) | **≤ 10 minutes** | Depends on selected provider + drill evidence |
| Cross-region Postgres (when provisioned & drilled) | **≤ 5 minutes** | **≤ 60 minutes** | **Not** a beta launch dependency |
| Worker code rollback | n/a (stateless) | **≤ 15 minutes** | Checked-in config + runbook |
| PageRelease pointer rollback | Prior artifact retained | **≤ 5 minutes** | Manifest history |
| Envelope → projection replay | 0 for accepted envelopes | Backlog-dependent; target drain < 60 min for beta volume | Reconciliation tooling |
| PITR restore (destructive) | Up to PITR granularity | Drill-defined; target ≤ 2 hours for beta dataset | 35-day PITR target |

Avoid active-active PostgreSQL initially.

## Error budget policy (engineering)

- Tier A burn → page incident commander; freeze non-recovery features; verify kill switches.
- Tier B burn → defer UX polish; keep intake/recovery staffed in business hours.
- Dependency (Tier D) burn → abstain/pause per liveness rules; do not invent success from infra logs.

## Explicit non-goals for beta contracts

- Four-nines contractual intake SLA  
- 24/7 staffed NOC  
- Cross-region RPO/RTO commitments before provisioned drills  
- Ad platform or ATS availability warranties  

See [recovery-criteria.md](./recovery-criteria.md) and [ADR 0010](./adr/0010-deployment-observability-rollback.md).
