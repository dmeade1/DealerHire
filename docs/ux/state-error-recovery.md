# States, errors, and recovery — beta UX

**Version:** 0.1 · **Date:** 2026-07-28  
Normative UI + domain states. Every state must have a visible representation, a recovery owner, and a test.

---

## 1. Cross-cutting UI states

| State | When | UI pattern | Recovery |
| --- | --- | --- | --- |
| `Loading` | In-flight fetch/mutation | Skeleton + busy status | Timeout → retry with idempotency |
| `Empty` | No records | One CTA explaining next step | Link to create/import |
| `Blocked` | Policy/facts/audit hard stop | Banner + reason codes + owner | Supply facts / fix findings |
| `Denied` | AuthZ fail | Denial summary + code | Request access / re-auth |
| `Expired` | Token/delegation/approval expired | Expire explainer | Reissue / reapprove |
| `ValidationError` | Field errors | Inline + summary | Fix fields |
| `StaleView` | Client cache behind | “Refresh for latest” | Reload |
| `Maintenance` | Kill switch | `COPY-MAINT-01` | Wait / ops |
| `Offline` | Network | Queue guidance; no fake success | Retry |

---

## 2. Listing / JobControl lifecycle (UI)

| Domain state | Meaning | UI | Transitions |
| --- | --- | --- | --- |
| `Draft` | Editable | Editor unlocked | → Normalized |
| `Normalized` | Conflicts resolved | Ready to audit | → Auditing |
| `Auditing` | Audit running | Progress | → Blocked / ReviewReady |
| `Blocked` | Hard findings | Findings list | → ChangesRequested |
| `ChangesRequested` | Human must edit | Diff tasks | → Draft |
| `ReviewReady` | Approvals available | Approvals CTA | → Approved |
| `Approved` | JCV immutable authority | Effect manifest sealed | → Published / re-audit on material change |
| `Published` | PageRelease live | Public URL | → Closed / re-audit |
| `Closed` | Intake off | Tombstone CTA off | → Archived |
| `Archived` | Historical | Read-only | — |
| `Invalidated` | Material change/policy | Reapproval required | → Auditing |

---

## 3. ApplicationAcceptanceEnvelope & intake

### 3.1 Envelope

| State | Meaning | Applicant UI | Ops UI |
| --- | --- | --- | --- |
| `Accepting` | Conditional insert in progress | Disable double submit | — |
| `Accepted` | **Receipt authority** | Receipt shown | Inspect envelope |
| `RejectedValidation` | Schema/policy reject | Errors; no receipt | — |
| `DuplicateIdempotent` | Same key replay | Same receipt | Link to original |

**Invariant:** Receipt UI only if `Accepted`.

### 3.2 Downstream projection

| State | Meaning | UI |
| --- | --- | --- |
| `Projecting` | PG/R2/integrations catching up | Receipt may show “finalizing details” |
| `Projected` | Application row exists | Full status |
| `Replaying` | Ops/system replay from envelope | Ops progress; applicant unchanged |
| `ProjectionFailed` | Needs ops | Applicant keeps receipt; ops alert |

### 3.3 ResumeAsset

| State | Meaning | Applicant UI | Recovery |
| --- | --- | --- | --- |
| `None` | No file | Optional upload later if allowed | — |
| `Uploading` | Stream in progress | Progress | Retry with same token |
| `PendingUpload` | Accepted app; file not durably stored | `COPY-RESUME-PENDING-01` + retry CTA | Retry upload; ops rebind |
| `Quarantined` | Awaiting/failed malware scan | “Resume under review” / resubmit guidance | Rescan / reject with notice |
| `Linked` | Clean + bound to application | “Resume received” | — |
| `RejectedMalware` | Failed scan | Safe rejection copy | Upload replacement |

**Invariant:** Envelope `Accepted` + `PendingUpload`/`Quarantined` is success for structured apply, not failure.

---

## 4. Notice / permission / communication

| State | UI | Notes |
| --- | --- | --- |
| `NoticeShown` | Version IDs on apply | Hashed into envelope |
| `PermissionGranted` / `Withdrawn` | Preference center (limited beta) | Immediate suppress on withdraw |
| `CommAuthorized` | — | Evaluated at enqueue **and** dispatch |
| `CommSuppressed` | Status may say email unavailable | Do not claim sent |
| `EmailQueued` / `Sent` / `Failed` | Receipt email status if shown | Failed ≠ application failed |

---

## 5. Review / decision

| State | UI | Rules |
| --- | --- | --- |
| `QueuedNeutral` | List without scores | Default |
| `InReview` | Matrix open | |
| `CorrectionHold` | Banner; matrix locked for edit | Reopen after correction |
| `NeedsVerify` | Cell state | Adverse needs primary evidence |
| `Decided` | Disposition recorded | DecisionRecord immutable except reconsideration |
| `ReconsiderationOpen` | After correction | New DecisionRecord version |
| `StartConfirmed` | Milestone | Ends clock |
| `QualifiedHire` | Badge in analytics/cases | Rubric + start |

---

## 6. Publication / channel

| State | UI |
| --- | --- |
| `PreviewArtifacts` | Preview URL signed |
| `Live` | Public |
| `RolledBack` | Prior manifest |
| `Tombstone` | Closed copy |
| `ExpiredChannelRelease` | Intake stopped; purge/tombstone |

---

## 7. Source liveness (sensors)

Used on campaigns, ATS, analytics, ops.

| State | Meaning | Analytical effect | Safety-critical effect |
| --- | --- | --- | --- |
| `Fresh` | Within TTL | Advice allowed (ops only in beta) | OK |
| `ObservedZero` | Heartbeat OK; zero volume | Show zero, not Missing | OK |
| `Missing` | No expected signal | Abstain new advice | May pause if required |
| `Stale` | TTL exceeded | **Abstain** | **Halt/pause** if budget/auth/execution |

Badge component required ([design-system.md](./design-system.md)).

---

## 8. Observation admission

| State | Meaning | UI |
| --- | --- | --- |
| `Accepted` | Eligible for analytics | Counted after reconcile |
| `Quarantined` | Failed admission policy | Quarantine queue; **never hides applicant from review** |
| `Rejected` | Invalid | Error reason |

---

## 9. NeedsReconciliation

| Aspect | Spec |
| --- | --- |
| When | Ambiguous provider/API/CSV/ATS outcomes; timeout after create; conflicting read-back |
| UI | Dedicated board + row status on campaign/ATS | 
| Allowed actions | Link to existing external ID; mark ignored with reason; compensate; safe retry **non-create** |
| Forbidden | Blind recreate; mark success without receipt; hide from ops |
| Exit | Human resolution + audit → `Reconciled` |

Related command states: `Proposed` → `Approved` → `CommandInserted` → `Executing` → `Receipted` | `NeedsReconciliation` | `Failed`.

---

## 10. Magic-link / access

| State | UI | Recovery |
| --- | --- | --- |
| `Valid` | Proceed | — |
| `Expired` | Request new link | Email reissue anti-enumeration |
| `Rotated` | Old link dead | Use latest email |
| `StepUpRequired` | Challenge via verified email | Complete step-up |
| `StepUpFailed` | Retry limits | Lost-channel recovery |
| `LockedRisk` | Generic message | Ops/support |

---

## 11. Delegation

| State | UI |
| --- | --- |
| `Active` | Persistent banner |
| `Expired` | Hard deny |
| `Revoked` | Hard deny |
| `MissingForTenant` | Ops must assume delegation |

---

## 12. Error catalog (user-facing)

| Code | Audience | Message intent |
| --- | --- | --- |
| `ERR_VALIDATION` | Applicant/dealer | Fix fields |
| `ERR_RATE_LIMIT` | Applicant | Try later |
| `ERR_AUTHZ_DENIED` | Dealer/ops | Capability missing |
| `ERR_HR_APPROVAL_REQUIRED` | Concierge | Cannot substitute |
| `ERR_POLICY_BLOCKED` | Dealer | Missing facts/findings |
| `ERR_ENVELOPE_REJECTED` | Applicant | No receipt; retryable guidance |
| `ERR_IDEMPOTENT_REPLAY` | Applicant | Soft success same receipt |
| `ERR_RESUME_PENDING` | Applicant | App OK; resume retry |
| `ERR_RESUME_QUARANTINED` | Applicant | Under review |
| `ERR_STALE_SAFETY` | Dealer | Paused until reconcile |
| `ERR_NEEDS_RECONCILIATION` | Dealer/ops | Ambiguous external effect |
| `ERR_MAINTENANCE` | All | Kill switch |
| `ERR_TOKEN_EXPIRED` | Applicant | New link |

Never show stack traces or other tenants’ data.

---

## 13. Recovery runbook mapping (UI)

| Scenario | Screen | Primary action | Success signal |
| --- | --- | --- | --- |
| PG lag after accept | SCR-OPS-03 | Replay ingest | Application Projected once |
| R2 outage at apply | SCR-APP-02/03 | Resume retry | Linked |
| Malware scanner down | Quarantined UI | Rescan | Linked or RejectedMalware |
| ATS timeout | SCR-ATS-02 / OPS-04 | Reconcile | ExportReceipt |
| CSV ambiguity | SCR-CMP-01/02 | NeedsReconciliation resolve | Fresh spend |
| False “failed apply” bug | — | **Defect** if envelope Accepted | Must not ship |

---

## 14. State coverage checklist

- [ ] ApplicationAcceptanceEnvelope Accepted/rejected/duplicate  
- [ ] PendingUpload + Quarantined + Linked  
- [ ] Fresh / ObservedZero / Missing / Stale  
- [ ] NeedsReconciliation  
- [ ] Listing Blocked / ReviewReady / Invalidated  
- [ ] Magic-link Expired / StepUp  
- [ ] Kill switch Maintenance  
- [ ] Admission Quarantined ≠ hidden from review
