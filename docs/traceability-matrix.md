# Traceability matrix

Maps hard invariants → authority → journey → UI → records → notices → events → tests → recovery. Keep rows coarse; expand per vertical slice as screens/forms land in `docs/ux/`.

| INV | Actor / authority | Journey | Screen / form (P0) | Record / state | Notice / copy | Event / telemetry | Test evidence | Recovery owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INV-07, INV-08 | Signed tenant/rooftop/purpose context | All authenticated | Control shell | Membership, session claims | — | authz_deny (no PII) | Isolation integration | Platform eng |
| INV-11–13 | Applicant; envelope sole receipt | Apply | Application form + upload | ApplicationAcceptanceEnvelope; resume PendingUpload/Quarantined | Privacy + terms + AI notice hashes | intake_accepted | Acceptance E2E; RC-01–03 | Intake owner |
| INV-14–15 | Public; PageRelease | View job | Public job page | PageRelease, artifacts | Published pay/disclosures | page_view (allowlisted) | Release pointer tests; RC-06 | Publication owner |
| INV-16–18 | Dealer HR / hiring owner | Listing approve/publish | Requirement/pay/rubric approval | JobControlVersion, ApprovalCase | Pay transparency copy | listing_approved | Domain + policy tests | Concierge + dealer |
| INV-19–21 | Approver + ledger | Campaign command (synth/sandbox) | Effect manifest diff | Command, outbox, ActuationReceipt, NeedsReconciliation | — | command_\* | Transaction + provider fixtures; RC-08 | Campaign owner |
| INV-22 | Dealer advertiser; no API actuator | Manual Meta/Google + CSV | CSV import | ImportBatch, spend observations | Employment ad disclosures | csv_imported | Import reconcile tests | Concierge |
| INV-23 | Controller function | Advice / execution | Recommendation UI | Fresh/Stale liveness | Abstain/halt copy | advice_abstain / execution_pause | Liveness tests | Platform eng |
| INV-24–26 | System only (shadow) | Candidate AI | **No reviewer UI** | InferenceUse (shadow) | AI notice (shadow vs live) | inference\_\* (IDs/hashes) | Shadow isolation; candidate-ai gate | AI owner |
| INV-27–28 | TrackerPolicy | Apply / rights / accommodation | Those surfaces | TrackerPolicyVersion | Cookie/GPC notices as counsel directs | server events allowlist | Tracking tests | Platform eng |
| INV-29–31 | Comm authz | Email (SMS off) | Preference / apply | NoticeReceipt, PermissionGrant, CommunicationAuthorizationDecision | Exact notice versions | email_enqueue/dispatch | Comms tests; RC-14 | Comms owner |
| INV-32–36 | Dealer + operator analytics | Reporting | Analytics dashboards | AttributionRun (descriptive), metrics versions | Claim-class labels in UI | metric_materialized | Analytics tests | Analytics owner |
| INV-37 | Platform ops | All | — | Logs/traces | — | correlation/causation IDs | Log redaction scans | Platform eng |
| INV-38–39, INV-51 | Platform ops | Incident / recovery | Ops CLI / page | Outbox/DLQ, kill switches | Status banners | ops_audit | RC-09, RC-15–16; rollback checklist | On-call eng |
| INV-40–42 | Jurisdiction resolver | Publish / AI / track / comms | Blocked states | RulePackVersion, obligation manifest | Fail-closed explanation | policy_deny | Policy permutation tests | Counsel + eng |
| INV-43 | Dealer + program | Role validation | Role acceptance matrices | Role taxonomy artifacts | — | — | All-role acceptance (G3) | Program owner |
| INV-44–46 | Dealer + platform | Apply / review | Application; vault | Demographics vault; no prior pay fields | Voluntary demo notice | — | Schema + access tests | Privacy owner |
| INV-47 | Admission | Analytics pipeline | — | AdmissionDecision | — | admission_rejected | Admission tests | Analytics owner |
| INV-48–49 | SemanticIndex / AI | Retrieval / extract | — | Vectors; model I/O | — | embedding\_\* | Filter-before-vector; injection evals | AI owner |
| INV-50 | RoleAllocationVersion | Feature enable | Admin enablement | RoleAllocationVersion | — | feature_blocked_unassigned | Gate checklist | Counsel + program |
| INV-52 | — | SLO reporting | Status | SLI series | External comms must not overclaim | slo_burn | Probe history | Eng lead |

## Journey coverage checklist

| Journey | Matrix rows present? | UX spec link |
| --- | --- | --- |
| Onboarding | Partial (authz) | TBD `docs/ux/` |
| Listing → audit → approve → publish | Yes | TBD |
| Apply → receipt → rights | Yes | TBD |
| Human review → disposition → start | Partial (INV-18, 35) | TBD |
| Campaign CSV reconcile | Yes | TBD |
| ATS handoff | Partial (partner docs) | TBD |
| Operational recovery | Yes | Runbooks TBD |

## Maintenance

- When adding a screen/form, add or update a row before implementation.
- Gate exits (G1–G3) attach evidence links (CI runs, drill notes) to the relevant INV rows.
- Counsel packet items that change notices update the Notice/copy column and ADR 0008 as needed.
