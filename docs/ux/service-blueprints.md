# Service blueprints — beta journeys

**Version:** 0.1 · **Date:** 2026-07-28  
Each blueprint lists **stages**, **actor actions**, **frontstage UI**, **backstage systems**, **support processes**, and **failure/recovery**.

---

## JB-01 — Partner onboarding (concierge)

**Actors:** P-HR, P-ADM, P-CON, S-LAW  
**Outcome:** Tenant/rooftop live on managed subdomain with policy pack, members, brand, ATS targets, ad CSV path.

| Stage | Frontstage | Backstage | Support |
| --- | --- | --- | --- |
| 1. Select partner | Dossier / readiness checklist (docs) | Partner facts store | Counsel nexus review |
| 2. Provision tenant | Ops confirms tenant+rooftop IDs | Org/access module; RLS context | Dual-control create |
| 3. Capture operating facts | HR questionnaire UI | Fail-closed fact registry | Missing facts → blocked badges |
| 4. Bind policy pack | “NY nexus pack vX” status | RulePackVersion effective-dated | Counsel sign-off artifact |
| 5. Invite members | Admin invites HR/REV/HM | IdP passwordless/MFA | Role capability grants |
| 6. Brand + subdomain | Upload logo/colors; preview | Content-addressed assets | PageRelease preview only |
| 7. ATS + ads prep | Mapping wizard; CSV template download | Canonical adapter stubs | Tech contact validation |
| 8. UAT kickoff | Training checklist | Synthetic jobs | Weekly UAT calendar |

**Failure:** Missing nexus/employee-count/etc. → all publication/campaign/AI/tracking/comms blocked with fact codes.  
**Exit:** HR sponsor acknowledges onboarding complete; G0 partner criterion eligible.

---

## JB-02 — Listing → audit → approval → publication

**Actors:** P-HM (context), P-HR (approvals), P-ADM/P-CON (assist)  
**Outcome:** English job live via `PageRelease`; intake enabled for that release.

```text
Draft/Import → Normalize → Audit → (Blocked|Changes|ReviewReady)
    → HR Approvals (req, pay, rubric, publish)
    → JobControlVersion immutable
    → Channel/Page artifacts → PageRelease pointer switch → Live
```

| Stage | Actor | UI | System | Evidence |
| --- | --- | --- | --- | --- |
| Author / import | HM/HR/ADM | Listing editor / import batch | ListingRevision, SourceRecord | Provenance preserved |
| Normalize | System | Progress + conflicts | Requirement modules by role family | Conflicts require human resolve |
| Audit | System + HR | Findings list (blocker / action / advisory) | AuditRun, Finding | No single opaque score |
| Fix | HM/HR | Diff editor | New ListingRevision | Invalidates prior approvals |
| Approve requirements | HR | Req checklist + job-relatedness | RequirementVersion | Proxy review flags |
| Approve compensation | HR | Min/max + structure form | Compensation facts on JCV | I-08 |
| Approve rubric | HR | Rubric editor | Qualification rubric version | |
| Approve publication | HR | **Effect manifest** + diff | ApprovalCase, token | I-09 |
| Publish | HR/ADM | Confirm release | PageRelease pointer | Rollback target shown |
| Live verify | Anyone | Public job URL | Artifacts on R2 | Liveness Fresh |

**Failure paths:**
- Hard blocker → cannot approve publication.
- Material edit after approve → re-audit + reapprove.
- Stale policy pack → halt publication.
- Operator attempts approve → denied (`AUTH_HR_APPROVAL_REQUIRED`).

**Exit:** Public URL returns English page; application CTA active; analytics exposure events admitted.

---

## JB-03 — Application → receipt

**Actors:** P-APP  
**Outcome:** Durable receipt after `ApplicationAcceptanceEnvelope` success; resume may be pending/quarantined.

| Stage | Applicant | UI | System |
| --- | --- | --- | --- |
| Land | Opens job | Public job (PageRelease) | No third-party scripts |
| Start apply | CTA | Apply shell; client idempotency ID | Turnstile risk-based |
| Structured fields | Completes core + role modules | Schema-driven form | Validation |
| Notices / choices | Reviews versioned notices | Separate notice blocks | NoticeReceipt hashes |
| Optional demos | Voluntary block | Explicitly optional | Compliance vault only |
| Resume | Upload / skip if degraded | Upload progress | PendingUpload if R2 down |
| Submit | Confirm | Disable double-submit | Envelope conditional insert |
| Receipt | Sees ID + next steps | Receipt screen + email | Queue non-gating |

**Degraded:**
- Scanner/R2 down → accept structured; resume `PendingUpload`/`Quarantined`; receipt still issued.
- Turnstile fail → quarantine/escalate path, not silent drop.
- Duplicate idempotency → same receipt, no second application.

**Exit:** Applicant has application ID; email transactional send authorized; projection reconciliation runs.

---

## JB-04 — Correction / privacy / accommodation

**Actors:** P-APP, P-REC (escalation), S-LAW (policy)  
**Outcome:** Correction reruns affected process; privacy request lineage resolved; accommodation routed without oversharing.

### Correction
1. Magic-link + step-up → correction form.  
2. Applicant submits changed fields / new resume.  
3. System marks dependent DecisionRecords for reconsideration.  
4. Reviewer notified; matrix reopened.  
5. Applicant sees “correction received” receipt.

### Privacy
1. Step-up → privacy request types (access, deletion, restriction, etc. per counsel pack).  
2. Create `PrivacyRequest`; suppress permission-based uses immediately where applicable.  
3. Ops/compliance processes lineage; verified completion or legal exception documented.  
4. Applicant status page updates without leaking internal notes.

### Accommodation
1. Public/accessible route from apply and receipt.  
2. Collect functional needs + contact channel—not diagnosis by default.  
3. Route to dealer HR accommodation owner; SLA messaging business-hours.  
4. Equivalent process timing/visibility preserved.

**Failure:** Lost email channel → authorized recovery flow with anti-enumeration.  
**Exit:** Case closed with ExportReceipt/completion artifact where required.

---

## JB-05 — Review → confirmed start (qualified hire path)

**Actors:** P-REV, P-HR, P-HM  
**Outcome:** DecisionRecords + milestones; optional qualified hire when rubric confirmed + start confirmed.

| Stage | UI | Rules |
| --- | --- | --- |
| Queue | Neutral-order applicant list | No ranking/AI scores |
| Evidence matrix | Requirement rows × evidence cells | Absence = unknown |
| Disposition | DecisionRecord form | Independent rationale; authority |
| Contact / interview / offer | Milestone capture | Employer-owned process |
| Rubric confirm | Explicit checklist of rubric version | Required for qualified hire |
| Start confirm | Start date + confirmer | Starts clock end |
| Qualified hire | Derived when both true | Report-only analytics |

**Failure:** Correction arrives → reopen. Missing rubric version → cannot mark qualified hire.  
**Exit:** HiringCase terminal or active employee milestone; funnel metrics update after reconciliation.

---

## JB-06 — Campaign CSV reconciliation

**Actors:** P-ADM, P-CON, P-HR  
**Outcome:** Spend/delivery observations admitted; Fresh or NeedsReconciliation visible; cost metrics usable.

| Stage | UI | System |
| --- | --- | --- |
| Download template | Admin campaigns | Expected columns + campaign keys |
| Manual Meta/Google change | Outside product | Dealer-owned accounts |
| Upload CSV | Import wizard | Signed/manual batch; provenance |
| Validate | Row errors | Schema/version admission |
| Reconcile | Desired vs observed | ActuationReceipt / observations |
| Ambiguity | NeedsReconciliation board | No blind recreate |
| Dashboard | Campaign tiles | Descriptive “allocated/associated”; freshness badges |

**Failure:** Stale source → abstain on advice; budget safety-critical stale → pause badges.  
**Exit:** Reconciled spend available for cost-per-qualified-hire after outcome maturity rules.

---

## JB-07 — ATS recovery

**Actors:** P-ADM, P-CON, P-REC  
**Outcome:** Application delivered or explicit failed/retry state; no silent loss.

| Stage | UI | System |
| --- | --- | --- |
| Export attempt | Status on application / batch | ExternalExportGrant / delivery |
| Provider timeout | NeedsReconciliation | Idempotent command_id |
| Mapping error | Field conflict UI | SourceRecord preserved |
| Replay | Ops replay action | From envelope/outbox |
| Receipt | ExportReceipt | Downstream suppression state |

**Exit:** ATS shows candidate **or** dealer sees actionable failure with last error code—not “success” without receipt.

---

## JB-08 — Operator recovery

**Actors:** P-REC (primary), eng on-call  
**Outcome:** Converged projections without DB edits.

| Scenario | UI/CLI | Success |
| --- | --- | --- |
| Envelope accepted, PG lag | Inspect envelope → replay ingest | Application projection exists once |
| Resume PendingUpload | Retry upload / rebind hash | ResumeAsset linked |
| Resume Quarantined | Malware re-scan / reject with notice | State terminal + applicant messaging |
| Outbox stuck | Replay outbox | Downstream confirmed |
| DLQ age alert | Drain with reason | Audit trail |
| Ambiguous provider create | NeedsReconciliation workspace | Human choose link/ignore/compensate |
| Incident | Kill switch intake/campaigns | Public apply shows maintenance; no false receipts |

**Invariant:** Recovery never requires direct SQL or spreadsheet side-channels (I-17).

---

## Cross-journey SLAs (UX messaging)

| Surface | Message posture |
| --- | --- |
| Applicant support | Business hours; emergency still accepts structured applications if intake up |
| Kill switch | Clear maintenance copy; no fake success |
| Analytics | “As of {ts} · {Freshness} · {ClaimClass}” on every tile |

## Blueprint acceptance

Each JB-* must pass partner or internal dry-run with:

1. Happy path demo  
2. One degraded/failure path  
3. Capability denial path where HR-only or default-deny applies  
4. Traceability row in [traceability.md](./traceability.md)
