# Invariant register

Hard invariants from DealerHire architecture. Violations are release blockers. IDs are stable for [traceability-matrix.md](./traceability-matrix.md).

| ID | Invariant | ADR / gate |
| --- | --- | --- |
| INV-01 | One modular monolith: one repo, one TS package, one Postgres; deployables only for isolation needs | ADR 0001 |
| INV-02 | PostgreSQL is authoritative transactional SoT; R2/queues/vectors/analytics are projections or buffers | ADR 0002 |
| INV-03 | Hyperdrive query cache is **off** for canonical state | ADR 0002 |
| INV-04 | Deterministic policy gates control legality, authz, spend, publication, transitions; AI cannot certify compliance, silently publish, auto-reject, or directly mutate ad platforms | ADR 0001, 0007 |
| INV-05 | Every consequential artifact is versioned and attributable | ADR 0001 |
| INV-06 | Every tenant-owned row has `tenant_id`; sensitive rows have rooftop + purpose | ADR 0003 |
| INV-07 | `FORCE ROW LEVEL SECURITY` (or equivalent mandatory boundary) on tenant-sensitive tables; runtime roles cannot bypass | ADR 0003 |
| INV-08 | Tenant/rooftop/purpose context set transaction-locally; missing context rejected | ADR 0003 |
| INV-09 | Cross-plane projections default-deny; allowlisted fields + full lineage only | ADR 0003 |
| INV-10 | Authority rechecked at every inference, embedding, retrieval, disclosure, communication, decision-support use | ADR 0003, 0008 |
| INV-11 | Application receipt iff independent `ApplicationAcceptanceEnvelope` conditional insert succeeds | ADR 0004 |
| INV-12 | Queue publication is non-gating; reconcile from accepted envelopes | ADR 0004 |
| INV-13 | R2/scanner outage → accept structured app; resume `PendingUpload`/`Quarantined`; never discard | ADR 0004 |
| INV-14 | Public pages served from `PageRelease` + content-addressed artifacts; independent of Postgres availability | ADR 0005 |
| INV-15 | Publication visibility only via single `PageRelease` pointer switch; rollback = prior manifest | ADR 0005 |
| INV-16 | Material listing/control change → successor `JobControlVersion`; invalidates dependent approval/execution authority | ADR 0005 |
| INV-17 | Approved min/max base-pay or rate range + applicable compensation structure required for every published role | ADR 0005 |
| INV-18 | Dealer HR/authorized owner approves requirements, pay facts, rubrics, publication; platform operator cannot substitute | ADR 0005, role-allocation |
| INV-19 | Approval token redemption + `Command` + outbox insert are one Postgres transaction | ADR 0006 |
| INV-20 | Provider calls occur outside the DB transaction; `command_id` is idempotency key | ADR 0006 |
| INV-21 | No `ActuationReceipt` ⇒ ineligible for effect learning; ambiguous create ⇒ `NeedsReconciliation`, never blind recreate | ADR 0006 |
| INV-22 | **No live ad API actuation in beta**; manual/CSV only until ad-actuation gate | ADR 0006, ad-actuation-release |
| INV-23 | Stale analytical evidence ⇒ abstain; stale safety-critical state ⇒ pause | ADR 0006, 0009 |
| INV-24 | Candidate AI is shadow-only in beta; invisible to reviewers/comms/campaigns/analytics; cannot affect decisions | ADR 0007, candidate-ai-release |
| INV-25 | Raw identifiable resumes not sent to external models; pinned AI Gateway routes only; no auto fallback | ADR 0007 |
| INV-26 | Equivalent non-AI path matches timing, visibility, correction, review standard, and outcome | ADR 0007 |
| INV-27 | TrackerPolicy default-deny; no third-party scripts on apply/rights/accommodation surfaces | ADR 0008 |
| INV-28 | Honor GPC/choices; no fingerprinting; strip tokens/unnecessary referrers | ADR 0008 |
| INV-29 | Notices/permissions/authority are separate versioned records—not one blanket consent | ADR 0008 |
| INV-30 | Transactional email in beta; SMS disabled until its gate | ADR 0008 |
| INV-31 | `CommunicationAuthorizationDecision` evaluated at enqueue **and** dispatch | ADR 0008 |
| INV-32 | Beta analytics are tenant-local, role-scoped, operational/descriptive only; no cross-tenant first-party output | ADR 0009 |
| INV-33 | No causal “lift/caused/effect” without `AnalysisContract` + confirmed actuation | ADR 0009 |
| INV-34 | Qualification/disposition/hire/attribution are report-only in beta; cannot feed campaign advice or candidate processing | ADR 0009 |
| INV-35 | Qualified hire = rubric confirmed + confirmed start; clock = job-control approval → start | ADR 0009 |
| INV-36 | Y90 never a candidate-level feature or current control input | ADR 0009 |
| INV-37 | Immutable logs/traces contain no applicant PII | ADR 0010 |
| INV-38 | Recovery never requires direct DB edits; audited ops tooling only | ADR 0010 |
| INV-39 | Worker rollback is code-only; schema/publication/provider compensation are explicit | ADR 0010 |
| INV-40 | Jurisdiction/policy missing facts fail closed for publish, campaign, AI, display, tracking, comms, export, decision support | Compliance plane |
| INV-41 | Remote and multi-state jobs excluded from beta | Beta envelope |
| INV-42 | Beta locale/host: English on managed platform subdomain | ADR 0005 |
| INV-43 | Every dealership role family deeply validated before live beta | Beta envelope / G3 |
| INV-44 | No prior-compensation collection in application/hiring path | Data inventory |
| INV-45 | FCRA-type third-party dossiers out of product boundary without separate design | Compliance |
| INV-46 | Protected demographics voluntary, segregated, inaccessible to decision-makers/models; never inferred | Data inventory |
| INV-47 | Admission may quarantine analytics/learning eligibility; never hide a valid application from human review | ADR 0009 |
| INV-48 | Exact structured filters before vector similarity; vectors never decide legal/hiring outcomes | ADR 0002 |
| INV-49 | Untrusted model inputs remain inert (no tools/credentials/cross-tenant egress) | ADR 0007 |
| INV-50 | RoleAllocationVersion duties must be assigned before feature launch | role-allocation |
| INV-51 | Always-available intake and campaign kill switches | ADR 0010 |
| INV-52 | 99.99% intake/page availability is engineering target, not beta contractual SLA | slos.md |

## Enforcement

- CI/integration tests map to INV IDs in the traceability matrix.
- Gate checklists (G1–G3, AI, ad actuation) cite relevant INV IDs.
- Ponytail/simplification exercises **cannot** remove invariants.
