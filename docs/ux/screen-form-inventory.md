# P0 screen & form inventory

**Version:** 0.1 · **Date:** 2026-07-28  
Complete P0 inventory for the NY concierge beta. Columns are normative for implementation and QA.

**Column key**

| Column | Meaning |
| --- | --- |
| ID | Stable screen ID |
| Actor | Primary persona(s) |
| Route | From IA |
| Entry / Exit | How user arrives / leaves |
| Form sections | Form regions (or “—” if view-only) |
| Domain record | Canonical records read/written |
| Permissions | Capability keys |
| States | Critical UI/domain states |
| Legal copy | Copy IDs from content deck |
| Analytics events | Allowlisted server events |
| A11y | Special WCAG notes |
| Acceptance test | Gate-oriented test ID |

---

## A — Public jobs

| ID | Actor | Route | Entry / Exit | Form sections | Domain record | Permissions | States | Legal copy | Analytics events | A11y | Acceptance test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-PUB-01 | APP | `/jobs` | Entry: careers link; Exit: job detail | — | PageRelease index | `public.job.read` | Empty, Stale release, Maintenance | — | `exposure.job_index` | Landmark list | AT-PUB-01 |
| SCR-PUB-02 | APP | `/jobs/{slug}` | Entry: index/ads; Exit: apply / closed | — | PageRelease, ChannelPostingRelease | `public.job.read` | Live, Closed, Tombstone, Expired | `COPY-PAY-01`, `COPY-EOE-01` | `exposure.job_detail` | Pay range readable | AT-PUB-02 |
| SCR-PUB-03 | APP | `/jobs/{slug}/apply` | Entry: CTA; Exit: resume step or submit | Identity contact; Experience; Role modules; Availability; Work auth (as required); Notices; Optional demos; Resume; Confirm | Application draft client; NoticeObligation | `application.submit` | Loading, ValidationError, TurnstileChallenge, DuplicateIdempotency | `COPY-NOTICE-*`, `COPY-AI-SHADOW-01`, `COPY-ACCOM-01` | `application.started` | Mobile-first; error association | AT-APP-01 |
| SCR-PUB-04 | APP | `/legal/privacy` | Footer; Exit: back | — | Notice version | public | Version pin | `COPY-PRIVACY-01` | — | Readable contrast | AT-COPY-01 |
| SCR-PUB-05 | APP | `/legal/application-terms` | Footer/apply | — | Notice version | public | Version pin | `COPY-TERMS-01` | — | Same | AT-COPY-02 |
| SCR-PUB-06 | APP | `/accessibility` | Footer/apply | Accommodation CTA | — | public | — | `COPY-ACCOM-01` | — | Skip link target | AT-A11Y-01 |

---

## B — Application intake & receipt

| ID | Actor | Route | Entry / Exit | Form sections | Domain record | Permissions | States | Legal copy | Analytics events | A11y | Acceptance test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-APP-01 | APP | POST intake (API) + UI confirm | Entry: apply confirm; Exit: receipt | Confirm summary | ApplicationAcceptanceEnvelope | `application.submit` | Accepting, Accepted, RejectedValidation, RateLimited | Notice hashes in envelope | `application.accepted` **only after envelope** | Announce success | AT-APP-02 |
| SCR-APP-02 | APP | `/applications/receipt/{id}` | Entry: redirect/email; Exit: status/magic | — | Envelope, Application projection | `application.receipt.read` | Accepted, PendingUpload, Quarantined, Replaying | `COPY-RECEIPT-01`, `COPY-RESUME-PENDING-01` | `application.receipt_viewed` | Focus to heading | AT-APP-03 |
| SCR-APP-03 | APP | `/apply/resume-upload/{token}` | Entry: receipt CTA; Exit: receipt | Resume file | ResumeAsset | capability token | PendingUpload, Uploading, Quarantined, Linked | `COPY-RESUME-PENDING-01` | `resume.upload_retry` | File input label | AT-APP-04 |
| SCR-APP-04 | APP | Email template: receipt | Entry: provider; Exit: magic link | — | CommunicationAuthorizationDecision | system | Queued, Sent, Suppressed | `COPY-EMAIL-RECEIPT-01` | `email.receipt_sent` | Plain-text alt | AT-APP-05 |

---

## C — Applicant self-service

| ID | Actor | Route | Entry / Exit | Form sections | Domain record | Permissions | States | Legal copy | Analytics events | A11y | Acceptance test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-SS-01 | APP | `/a/{token}` | Email link; Exit: status | — | Access capability | token | Valid, Expired, Rotated, StepUpRequired | `COPY-MAGIC-01` | `access.magic_used` | Clear expiry | AT-SS-01 |
| SCR-SS-02 | APP | `/a/{token}/status` | Magic; Exit: correct/privacy | — | Application, milestones (safe) | receipt read | InReview, DecisionPending, Closed | `COPY-STATUS-01` | `application.status_viewed` | Live region for updates | AT-SS-02 |
| SCR-SS-03 | APP | `/a/{token}/correct` | Status; Exit: confirmation | Fields to correct; New resume; Reason | Correction request | `application.correct` + step-up | StepUp, Submitted, ReopenPending | `COPY-CORRECT-01` | `application.correction_submitted` | Error summary | AT-SS-03 |
| SCR-SS-04 | APP | `/a/{token}/privacy` | Status; Exit: case ID | Request type; Channel verify | PrivacyRequest | `privacy.request` + step-up | Submitted, InProgress, Complete, LegalException | `COPY-PRIVACY-REQ-01` | `privacy.request_submitted` | No third-party scripts | AT-SS-04 |
| SCR-SS-05 | APP | `/a/{token}/accommodation` | Apply/status/a11y; Exit: ticket | Needs; Preferred contact; Job ref | Accommodation case | `accommodation.request` | Submitted, Routed | `COPY-ACCOM-01` | `accommodation.requested` | Accessible form | AT-SS-05 |
| SCR-SS-06 | APP | `/a/{token}/notices` | Status | — | NoticeReceipt | read | — | shown versions | — | Printable | AT-SS-06 |

---

## D — Dealer: listing & publication

| ID | Actor | Route | Entry / Exit | Form sections | Domain record | Permissions | States | Legal copy | Analytics events | A11y | Acceptance test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-DLR-01 | HR/HM/ADM | `/app` | Login; Exit: task | — | Attention projections | role | Empty inbox | — | `dealer.home_viewed` | | AT-DLR-01 |
| SCR-DLR-02 | HR/HM/ADM | `/app/jobs` | Nav; Exit: job | Filters | Job list | listing read | Empty, FilteredZero | — | `listing.list_viewed` | | AT-DLR-02 |
| SCR-DLR-03 | HM/HR/ADM | `/app/jobs/new` | CTA; Exit: edit | Department; Family; Title; Location (NY); Remote=false lock | ListingRevision | `listing.draft` | Draft | — | `listing.created` | | AT-DLR-03 |
| SCR-DLR-04 | HR/ADM/CON | `/app/jobs/import` | Nav; Exit: batch detail | File; Mapping | ImportBatch, SourceRecord | `listing.import` | Validating, Conflicts, Imported | — | `listing.imported` | | AT-DLR-04 |
| SCR-DLR-05 | HM/HR | `/app/jobs/{id}/edit` | List; Exit: audit | Core listing; Description; Schedule; HM context | ListingRevision | `listing.draft` | Draft, ChangesRequested, Dirty | — | `listing.saved` | Autosave status | AT-DLR-05 |
| SCR-DLR-06 | HR | `/app/jobs/{id}/requirements` | Edit; Exit: approve | Must-haves; Equivalents; Essential function; Accommodation note; Proxy review | RequirementVersion | draft + `requirements.approve` | Draft, Approved, Expired | `COPY-REQ-PROXY-01` | `requirements.approved` | | AT-DLR-06 |
| SCR-DLR-07 | HR | `/app/jobs/{id}/compensation` | Edit; Exit: approve | Pay type; Min; Max; Structure modules; Benefits | Comp facts → JCV | `compensation.approve` | Incomplete, Approved | `COPY-PAY-01` | `compensation.approved` | Min≤max | AT-DLR-07 |
| SCR-DLR-08 | HR | `/app/jobs/{id}/rubric` | Edit; Exit: approve | Rubric rows; Pass rules | Rubric version | `rubric.approve` | Draft, Approved | — | `rubric.approved` | | AT-DLR-08 |
| SCR-DLR-09 | HR/ADM | `/app/jobs/{id}/audit` | After save; Exit: fix/approve | — | AuditRun, Finding | `listing.audit.run` | Auditing, Blocked, ReviewReady | — | `audit.completed` | Finding severity | AT-DLR-09 |
| SCR-DLR-10 | HR | `/app/jobs/{id}/approvals` | Audit ready; Exit: publish | Effect manifest review; Authority attest | ApprovalCase, JobControlVersion | HR approve caps | ReviewReady, Approved, Invalidated | `COPY-APPROVAL-01` | `publication.approved` | Manifest focus order | AT-DLR-10 |
| SCR-DLR-11 | HR/ADM | `/app/jobs/{id}/release` | Approved; Exit: public URL | Confirm pointer switch; Rollback target | PageRelease | `page_release.publish` | Preview, Live, RolledBack, Tombstone | — | `page_release.switched` | | AT-DLR-11 |

---

## E — Dealer: review & hiring

| ID | Actor | Route | Entry / Exit | Form sections | Domain record | Permissions | States | Legal copy | Analytics events | A11y | Acceptance test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-REV-01 | REV/HR | `/app/applications` | Inbox; Exit: matrix | Filters (non-ranking) | Application queue | `application.review.read` | Empty, NeutralOrder | — | `review.queue_viewed` | | AT-REV-01 |
| SCR-REV-02 | REV | `/app/applications/{id}` | Queue; Exit: decision | Evidence matrix; Rationale; Disposition | Application, DecisionRecord | review + `decision.record` | InReview, CorrectionHold, Decided | `COPY-REVIEW-01` | `review.decision_recorded` | Matrix keyboard | AT-REV-02 |
| SCR-REV-03 | REV/HR/HM | `/app/applications/{id}/milestones` | Matrix; Exit: case | Contact; Interview; Offer; Start; Rubric confirm | Milestones, HiringCase | `milestone.record`, `start.confirm`, `qualified_hire.confirm` | Partial, Started, QualifiedHire | — | `hiring.milestone_recorded` | | AT-REV-03 |
| SCR-REV-04 | HR/REV | `/app/hiring-cases` | Nav | — | HiringCase | hiring read | Open, Closed | — | `hiring.cases_viewed` | | AT-REV-04 |

---

## F — Campaigns, ATS, analytics, settings

| ID | Actor | Route | Entry / Exit | Form sections | Domain record | Permissions | States | Legal copy | Analytics events | A11y | Acceptance test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-CMP-01 | ADM/HR | `/app/campaigns` | Nav; Exit: import/job | — | CampaignPlan, liveness | reconcile view | Fresh, ObservedZero, Missing, Stale, NeedsReconciliation | `COPY-ANALYTICS-CLAIM-01` | `campaign.list_viewed` | Badges | AT-CMP-01 |
| SCR-CMP-02 | ADM/CON | `/app/campaigns/import` | CTA; Exit: result | File; Account; Period; Signature attest | ImportBatch, observations | `campaign.csv.import` | Validating, Admitted, QuarantinedRows, NeedsReconciliation | — | `campaign.csv_imported` | | AT-CMP-02 |
| SCR-ATS-01 | ADM/HR | `/app/ats` | Nav | Connection; Mapping | ATS connection | `ats.mapping.edit` | Connected, Degraded | — | `ats.settings_viewed` | | AT-ATS-01 |
| SCR-ATS-02 | ADM/REC | `/app/ats/deliveries` | Nav | Retry actions | ExportReceipt, delivery attempts | `ats.export.trigger` | Delivered, Failed, NeedsReconciliation | — | `ats.delivery_replayed` | | AT-ATS-02 |
| SCR-AN-01 | HR/ADM | `/app/analytics` | Nav | — | Metric read models | `analytics.tenant.read` | Mixed freshness | `COPY-ANALYTICS-CLAIM-01` | `analytics.hub_viewed` | | AT-AN-01 |
| SCR-AN-02 | HR | `/app/analytics/funnel` | Hub | Cohort controls | Funnel metrics | analytics | Hourly/Daily reconciled | claim copy | `analytics.funnel_viewed` | | AT-AN-02 |
| SCR-AN-03 | HR | `/app/analytics/recruiters` | Hub | — | Workload metrics | analytics | | claim copy | | | AT-AN-03 |
| SCR-AN-04 | HR | `/app/analytics/compliance` | Hub | — | Notice/consent evidence | analytics | **No demos** | claim copy | | | AT-AN-04 |
| SCR-AN-05 | HR | `/app/analytics/quality` | Hub | — | Qualified hire, clock, cost | analytics | Report-only | `COPY-METRIC-QH-01` | | | AT-AN-05 |
| SCR-SET-01 | ADM/HR | `/app/settings/members` | Nav | Invite; Role | Membership | `member.manage` | Invited, Active | — | `member.invited` | | AT-SET-01 |
| SCR-SET-02 | ADM | `/app/settings/brand` | Nav | Logo; Colors; Home copy | BrandSite assets | brand edit | Preview, Published | — | `brand.updated` | Contrast check | AT-SET-02 |
| SCR-SET-03 | HR | `/app/settings/operating-facts` | Onboarding | Employee count; FC; Union; OEM; Nexus… | Fact registry | HR/ADM | Incomplete→Blocked | `COPY-FACTS-BLOCK-01` | `facts.updated` | | AT-SET-03 |
| SCR-SET-04 | HR/ADM | `/app/settings/delegations` | Nav | Grant; Scope; Expiry | Delegation | `delegation.grant` | Active, Expired | — | `delegation.granted` | | AT-SET-04 |
| SCR-SET-05 | HR | `/app/settings/notices` | Nav | Preview | Notice versions | read | | counsel IDs | | | AT-SET-05 |
| SCR-SUP-01 | All dealer | `/app/support` | Nav | Topic; Urgency | Support ticket | authenticated | BusinessHours, AfterHours | `COPY-SUPPORT-01` | `support.requested` | | AT-SUP-01 |

---

## G — Internal ops

| ID | Actor | Route | Entry / Exit | Form sections | Domain record | Permissions | States | Legal copy | Analytics events | A11y | Acceptance test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-OPS-01 | REC/CON | `/ops` | Login; Exit: tool | — | Ops home | ops | DelegationRequired | — | `ops.home` | Banner | AT-OPS-01 |
| SCR-OPS-02 | REC | `/ops/recovery` | Nav | Inspect query; Replay confirm | Envelope, outbox, DLQ | `ops.inspect`, `ops.replay` | Replaying, Reconciled | — | `ops.replay` | Confirm dialog | AT-OPS-02 |
| SCR-OPS-03 | REC | `/ops/recovery/envelopes/{id}` | Recovery; Exit: replay | — | ApplicationAcceptanceEnvelope | inspect | Accepted, PendingUpload, Quarantined | — | | Redact PII in display logs | AT-OPS-03 |
| SCR-OPS-04 | REC | `/ops/recovery/reconciliation` | Nav | Resolve action | NeedsReconciliation cases | replay/resolve | Open, Resolved | — | `ops.reconciliation_resolved` | | AT-OPS-04 |
| SCR-OPS-05 | REC | `/ops/kill-switches` | Nav | Scope; Reason | Kill switch records | `ops.kill_switch` | Armed, Active | `COPY-MAINT-01` | `ops.kill_switch` | Destructive confirm | AT-OPS-05 |
| SCR-OPS-06 | REC | `/ops/liveness` | Nav | — | Source liveness | inspect | Fresh, ObservedZero, Missing, Stale | — | | Badges | AT-OPS-06 |
| SCR-OPS-07 | REC | `/ops/privacy-cases` | Escalation | Resolution notes | PrivacyRequest | platform+subject | | | `ops.privacy_resolved` | | AT-OPS-07 |
| SCR-OPS-08 | REC | `/ops/platform-health` | Nav | — | Intake/integration SLIs | inspect | | claim operational | | | AT-OPS-08 |

---

## H — Explicitly out of P0 inventory

Do not implement screens for: SMS console, custom domain wizard, Spanish locale switcher, candidate AI review panel, live ad actuation approval (post-beta), cross-tenant benchmarks, candidate marketplace profile, prior-pay fields, FCRA enrichment.

---

## Inventory counts

| Plane | P0 screens |
| --- | --- |
| Public | 6 |
| Intake/receipt | 4 |
| Self-service | 6 |
| Listing/publication | 11 |
| Review/hiring | 4 |
| Campaigns/ATS/analytics/settings | 16 |
| Ops | 8 |
| **Total** | **55** |

Every ID above must appear in [traceability.md](./traceability.md) for at least one invariant.
