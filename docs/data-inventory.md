# Data inventory

Inventory of DealerHire data classes, purpose planes, systems of record, and retention posture. Field-level detail lives in [purpose-field-retention-matrix.md](./purpose-field-retention-matrix.md). Legal retention floors require counsel confirmation for the partner’s NY/NYC nexus.

## Purpose planes

| Plane | Purpose | Primary SoT |
| --- | --- | --- |
| Hiring operations | Recruit, evaluate, hire for a rooftop job | PostgreSQL |
| Subject / permission | Notices, choices, rights, accommodation | PostgreSQL (+ envelope at intake) |
| Publication / disclosure | Public job pages, creatives, channel posts | R2 artifacts + `PageRelease` in Postgres |
| Platform control | Policy, commands, audit refs, releases | PostgreSQL |

Cross-plane copies are default-deny, allowlisted, and lineage-bearing.

## Data classes

| Class | Examples | Sensitivity | Plane(s) | SoT / store | Analytics eligibility |
| --- | --- | --- | --- | --- | --- |
| Org identity | DealerGroup, Rooftop, Team, Membership | Medium | Platform / hiring | Postgres | Tenant-local ops |
| Auth session | IdP subject, MFA state | High | Platform | Managed IdP | None (hashes/IDs only in logs) |
| Listing / job control | ListingRevision, RequirementVersion, JobControlVersion | Medium | Hiring / publication | Postgres | Descriptive after reconcile |
| Policy / audit | RulePackVersion, Finding, ApprovalCase | Medium–High | Platform / hiring | Postgres | Compliance evidence |
| Publication artifacts | Page/creative objects, PageRelease | Low–Medium | Publication | R2 public + Postgres pointer | Ops (cache/purge) |
| Campaign / command | CampaignPlan, Command, ActuationReceipt, CSV imports | Medium–High (spend) | Hiring / platform | Postgres | Ops + descriptive spend |
| Application envelope | Encrypted acceptance envelope | Critical | Subject | Independent envelope provider | Never raw |
| Application / resume | Application, ResumeAsset, parsed evidence | Critical | Hiring / subject | Postgres + R2 private | Minimized events only |
| Notices / permissions | NoticeReceipt, PermissionGrant, DataUseAuthority | High | Subject | Postgres | Compliance counts |
| Demographics (voluntary) | Compliance vault | Critical / segregated | Subject | Segregated vault | Approved compliance analysis only |
| Communications | Email content refs, authz decisions, suppressions | High | Subject / hiring | Postgres + email provider | Delivery ops |
| AI / inference | InferenceUse, shadow extractions, model registry | High | Platform / hiring | Postgres (deletable outputs) | Shadow not in beta analytics |
| Vectors | Embeddings + metadata | High | Hiring / platform | pgvector | Retrieval only; exact filters first |
| Observations / metrics | Touchpoints, AttributionRun, cohorts | Medium | Platform | Postgres → R2 analytics | Admitted, de-identified |
| Secrets / tokens | Ad OAuth refresh, webhook secrets | Critical | Platform | Worker secrets + field encryption | None |
| Labor market data | Licensed BLS/O\*NET/vendor | Medium | Platform | Postgres / licensed store | Per license terms |
| Logs / traces | Correlation IDs, statuses, latency | Low (must stay PII-free) | Platform | Observability vendor | Ops only |

## Storage classes

1. **PostgreSQL** — transactional state, permissions, policy, commands, outbox/inbox, audit references, consent/authority, operational reporting, pgvector.
2. **R2 private** — resumes, private manifests, backup artifacts; lifecycle + legal hold aware.
3. **R2 public** — content-addressed published pages/creatives.
4. **R2 analytics** — append-only de-identified Parquet/Iceberg; not a customer query surface; not the observation ledger.
5. **Independent acceptance envelope** — sole intake receipt authority (ADR 0004).

## Retention posture (engineering defaults)

Counsel must confirm floors for EEOC/OFCCP, NY/NYC, and partner contracts. Engineering defaults:

| Class | Default posture |
| --- | --- |
| Applications / hiring records | Retain to statutory employment recordkeeping floor + legal hold; deletion exceptions documented |
| Resumes (R2) | Align with application retention; quarantine until scan; legal hold blocks purge |
| Notices / permissions | Retain as long as dependent processing or statutory proof requires |
| Commands / actuation receipts | Retain for reconciliation, audit, and spend disputes |
| InferenceUse / shadow AI | Deletable purpose-scoped records; immutable telemetry = IDs/hashes/status/cost/timing only |
| Analytics projections | De-identified; retention per admission policy; no raw PII |
| Logs | Short operational retention; no applicant PII |
| PITR / backups | 35-day PITR target; encrypted daily + off-platform copy; legal hold process for restores |

## Prohibited / deferred data uses

- Prior-compensation collection in application or hiring path.
- FCRA-regulated third-party background/MVR/social/reputation/reference dossiers without a separate compliant product.
- Cross-client candidate graphs or shared candidate identifiers.
- Raw PII in immutable analytics or logs.
- Inferred protected demographics.
- Cross-tenant first-party benchmarks in beta.
- Y90 as candidate-level label or current control input.

## Ownership

| Role | Data duty (working) |
| --- | --- |
| Dealer | Controller / employer / deployer — hiring decisions and much applicant PII purpose |
| Platform | Processor / service provider / AI developer-provider |

See [role-allocation.md](./role-allocation.md).
