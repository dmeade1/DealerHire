# Traceability matrix — beta UX

**Version:** 0.1 · **Date:** 2026-07-28  
Maps **invariant → persona → journey → screen → field → permission → copy → event → test**.  
Use before implementing or changing P0 behavior. Gaps block G0-UX-10.

Legend: I-* = [charter.md](./charter.md) · P-* = [personas.md](./personas.md) · JB-* = [service-blueprints.md](./service-blueprints.md) · SCR-* = [screen-form-inventory.md](./screen-form-inventory.md)

---

## 1. Master matrix

| Invariant | Persona | Journey | Screen(s) | Field / record | Permission | Copy ID | Analytics event | Test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| I-01 Employer authority | P-HR (not P-CON) | JB-02 | SCR-DLR-06…10 | RequirementVersion, comp.*, rubric, ApprovalCase | `requirements.approve`, `compensation.approve`, `rubric.approve`, `publication.approve` | `COPY-APPROVAL-01` | `requirements.approved`, `compensation.approved`, `rubric.approved`, `publication.approved` | AT-DLR-06…10; deny path for P-CON |
| I-02 Default-deny capability | All authenticated | All dealer/ops | All `/app`, `/ops` | auth context claims | all caps | denial UX codes | `authz.denied` (ops telemetry, no PII) | isolation tests; AT-OPS-01 |
| I-03 Receipt = envelope | P-APP | JB-03 | SCR-APP-01, SCR-APP-02 | ApplicationAcceptanceEnvelope | `application.submit`, `application.receipt.read` | `COPY-RECEIPT-01` | `application.accepted` only post-insert | AT-APP-02, AT-APP-03 |
| I-04 Degraded resume | P-APP, P-REC | JB-03, JB-08 | SCR-APP-02, SCR-APP-03, SCR-OPS-03 | `resume_state` PendingUpload/Quarantined | submit + ops.replay | `COPY-RESUME-PENDING-01`, `COPY-RESUME-QUARANTINE-01` | `resume.upload_retry` | AT-APP-03, AT-APP-04, AT-OPS-03 |
| I-05 Atomic notices | P-APP | JB-03 | SCR-PUB-03, SCR-SS-06 | notice_* versions, NoticeReceipt, manifest hash | `application.submit` | `COPY-TERMS-01`, `COPY-PRIVACY-01`, `COPY-AI-SHADOW-01`, `COPY-ACCOM-01` | `application.started` / accepted w/ hash | AT-COPY-01, AT-SS-06, AT-APP-02 |
| I-06 Human review no AI | P-REV | JB-05 | SCR-REV-01, SCR-REV-02 | DecisionRecord matrix statuses | `application.review.read`, `decision.record` | `COPY-REVIEW-01` | `review.decision_recorded` | AT-REV-01, AT-REV-02, AT-AN-AI-01 |
| I-07 Protected demos vault | P-APP write; decision-makers none | JB-03, JB-05 | SCR-PUB-03 (optional); never SCR-REV-* | `vault.*` | vault purpose only; deny hiring purpose | privacy notice clause | none on hiring analytics | AT-AN-VAULT-01, AT-REV-02 |
| I-08 Pay transparency | P-HR, P-APP | JB-02, public | SCR-DLR-07, SCR-PUB-02, SCR-PUB-03 | `comp.base_min/max`, structure.* | `compensation.approve`, `public.job.read` | `COPY-PAY-01` | `compensation.approved`, `exposure.job_detail` | AT-DLR-07, AT-PUB-02 |
| I-09 Effect-manifest approval | P-HR | JB-02 | SCR-DLR-10 | ApprovalCase, JobControlVersion | `publication.approve` | `COPY-APPROVAL-01` | `publication.approved` | AT-DLR-10 |
| I-10 PageRelease publication | P-HR, P-ADM, P-APP | JB-02 | SCR-DLR-11, SCR-PUB-02 | PageRelease | `page_release.publish`, `public.job.read` | — / tombstone | `page_release.switched`, `exposure.job_detail` | AT-DLR-11, AT-PUB-02 |
| I-11 Analytics claim class | P-HR, P-ADM | JB-06 | SCR-AN-*, SCR-CMP-01 | metric_version, claim_class | `analytics.tenant.read` | `COPY-ANALYTICS-CLAIM-01` | `analytics.*_viewed` | AT-AN-CLAIM-01 |
| I-12 Metric definitions | P-HR, P-REV | JB-05 | SCR-REV-03, SCR-AN-05 | rubric confirm, start, cost fields | `qualified_hire.confirm`, `start.confirm`, analytics read | `COPY-METRIC-QH-01` | `hiring.milestone_recorded` | AT-AN-QH-01, AT-REV-03 |
| I-13 Freshness honesty | P-ADM, P-REC | JB-06, JB-08 | SCR-CMP-01, SCR-OPS-06, analytics tiles | liveness Fresh/Zero/Missing/Stale | reconcile.view, ops.inspect | stale banners | campaign/ops views | AT-AN-FRESH-01, AT-OPS-06 |
| I-14 No 3P tracking sensitive | P-APP | JB-03, JB-04 | SCR-PUB-03, SCR-SS-03…05, SCR-PUB-06 | TrackerPolicyVersion default-deny | — | — | allowlisted server events only | AT-TRACK-01 |
| I-15 Equivalent non-AI path | P-REV, P-APP | JB-05 | SCR-REV-02 | DecisionRecord manual path | `decision.record` | `COPY-REVIEW-01`, `COPY-AI-SHADOW-01` | `review.decision_recorded` | AT-REV-02 |
| I-16 A11y mobile-first | P-APP | JB-03, JB-04 | SCR-PUB-*, SCR-APP-*, SCR-SS-* | forms | public/submit | `COPY-ACCOM-01` | — | AT-A11Y-01…02; G5-UX |
| I-17 Audited recovery | P-REC | JB-07, JB-08 | SCR-OPS-02…05, SCR-ATS-02 | envelope, outbox, ExportReceipt | `ops.inspect`, `ops.replay`, `ops.kill_switch` | `COPY-MAINT-01` | `ops.replay`, `ops.kill_switch` | AT-OPS-02…05, AT-ATS-02 |
| I-18 Fail closed missing facts | P-HR | JB-01, JB-02 | SCR-SET-03, SCR-DLR-09…10 | operating facts registry | facts edit; publish blocked | `COPY-FACTS-BLOCK-01` | `facts.updated` | AT-SET-03, AT-DLR-09 |

---

## 2. Journey coverage matrix

| Journey | Primary persona | Screens (min) | Invariants | Must-pass tests |
| --- | --- | --- | --- | --- |
| JB-01 Onboarding | P-HR, P-ADM, P-CON | SCR-SET-01…04, SCR-DLR-01 | I-02, I-18 | AT-SET-01…04, AT-DLR-01 |
| JB-02 Listing→publish | P-HR | SCR-DLR-03…11, SCR-PUB-02 | I-01, I-08, I-09, I-10, I-18 | AT-DLR-03…11, AT-PUB-02 |
| JB-03 Apply→receipt | P-APP | SCR-PUB-02…03, SCR-APP-01…04 | I-03, I-04, I-05, I-14, I-16 | AT-APP-01…05, AT-TRACK-01 |
| JB-04 Correct/privacy/accom | P-APP | SCR-SS-01…06 | I-05, I-14, I-16 | AT-SS-01…06 |
| JB-05 Review→start | P-REV, P-HR | SCR-REV-01…04 | I-06, I-07, I-12, I-15 | AT-REV-01…04, AT-AN-QH-01 |
| JB-06 Campaign CSV | P-ADM | SCR-CMP-01…02, SCR-AN-* | I-11, I-12, I-13 | AT-CMP-01…02, AT-AN-FRESH-01 |
| JB-07 ATS recovery | P-ADM, P-REC | SCR-ATS-01…02, SCR-OPS-04 | I-02, I-17 | AT-ATS-01…02, AT-OPS-04 |
| JB-08 Operator recovery | P-REC | SCR-OPS-01…08 | I-03, I-04, I-17 | AT-OPS-01…08 |

---

## 3. NeedsReconciliation & liveness traceability

| Domain state | Persona | Screen | Permission | Event | Test |
| --- | --- | --- | --- | --- | --- |
| NeedsReconciliation | P-ADM, P-REC | SCR-CMP-01, SCR-ATS-02, SCR-OPS-04 | reconcile.view, ops.replay | `ops.reconciliation_resolved` | AT-OPS-04, AT-CMP-02 |
| Fresh | P-ADM | SCR-CMP-01, analytics | analytics/campaign read | — | AT-AN-FRESH-01 |
| ObservedZero | P-ADM | same | same | — | AT-AN-FRESH-01 |
| Missing | P-ADM, P-REC | SCR-OPS-06 | ops.inspect | — | AT-OPS-06 |
| Stale | P-ADM, P-REC | badges + pause | same | — | AT-AN-FRESH-01 |
| ApplicationAcceptanceEnvelope.Accepted | P-APP | SCR-APP-02 | receipt.read | `application.accepted` | AT-APP-02 |
| PendingUpload | P-APP | SCR-APP-02/03 | capability token | `resume.upload_retry` | AT-APP-04 |
| Quarantined | P-APP, P-REC | SCR-APP-02, SCR-OPS-03 | ops + applicant | — | AT-OPS-03 |

---

## 4. Deferred-feature negative traceability

Ensure **no** P0 row depends on:

| Deferred item | Assert absent from |
| --- | --- |
| Live ad actuation UI | SCR-CMP-*, approvals |
| SMS | SCR-PUB-03, comms |
| Spanish | IA locale switch |
| Candidate AI panel | SCR-REV-02 |
| Cross-tenant benchmarks | SCR-AN-* |
| Custom domains | SCR-SET-02 |
| Prior pay fields | field dictionary |

Test: AT-AN-CLAIM-01, AT-AN-AI-01, inventory §H review.

---

## 5. Counsel stakeholder links

| Concern | Copy / artifact | Screens | Gate |
| --- | --- | --- | --- |
| Nexus pack | Policy + `COPY-PRIVACY-01` final | SCR-SET-03, apply notices | G2 |
| Role allocation | RoleAllocationVersion | onboarding docs + settings | G0/G3 |
| AI shadow | `COPY-AI-SHADOW-01` | SCR-PUB-03 | G2 |
| Analytics causation | `COPY-ANALYTICS-CLAIM-01` | SCR-AN-* | G3 |
| Accommodation | `COPY-ACCOM-01` | SCR-PUB-06, SCR-SS-05 | G2 |

---

## 6. Gap log

| ID | Gap | Owner | Blocks |
| --- | --- | --- | --- |
| GAP-01 | Final counsel text for notices | S-LAW | G2-UX-11 |
| GAP-02 | Partner UAT sign-off | P-HR | G3-UX-02/03 |
| GAP-03 | High-fi visual for W-01…05 | Design | G2 polish (not G0) |
| GAP-04 | Exact hostname / brand tokens | Product | G3 public |

---

## 7. Maintenance rules

1. New P0 screen → add inventory row + at least one matrix row here.  
2. New invariant → charter + this matrix + test ID.  
3. Permission change → capability-matrix + deny/allow tests.  
4. Copy change → new version ID + envelope hash compatibility note.  
5. Metric definition change → field-dictionary + AT-AN-QH-01 update.

---

## 8. Traceability acceptance

- [x] All I-01…I-18 appear in §1  
- [x] All JB-01…08 appear in §2  
- [x] Envelope, PendingUpload, Quarantined, liveness, NeedsReconciliation in §3  
- [ ] Partner/counsel gaps in §6 closed before respective gates
