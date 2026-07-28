# Capability matrix — beta

**Version:** 0.1 · **Date:** 2026-07-28  
**Model:** Default-deny. An action is allowed only when **all** of the following match: capability grant, tenant, rooftop (when required), purpose plane, and (if elevated) unexpired delegation.

## 1. Authorization context (required on every request)

| Claim | Required | Notes |
| --- | --- | --- |
| `actor_id` | Always | Real human or service identity |
| `tenant_id` | Tenant-scoped actions | Reject if missing |
| `rooftop_id` | Rooftop-sensitive records | Beta: single rooftop |
| `purpose` | Always | One of purpose planes below |
| `capability` | Always | Fine-grained action key |
| `delegation_id` | When acting for another party | Expiring; stores `on_behalf_of` |
| `session_assurance` | Sensitive applicant/dealer actions | e.g. step-up completed |

UI must fail closed with a denial reason code when any claim is missing or mismatched.

## 2. Purpose planes

| Purpose | Code | Examples |
| --- | --- | --- |
| Hiring operations | `purpose:hiring` | Listings, review, dispositions, starts |
| Subject / permission | `purpose:subject` | Notices, privacy, correction, accommodation |
| Publication / disclosure | `purpose:publication` | PageRelease, channel posts, public job pages |
| Platform control | `purpose:platform` | Recovery, kill switches, cross-tenant ops |
| Compliance analysis (segregated) | `purpose:compliance_vault` | Voluntary demographics analytics only |

Cross-plane projections are default-deny and allowlist-field only.

## 3. Role → default capability bundles (beta)

Legend: **Y** = yes · **N** = no · **D** = only with explicit dealer delegation · **S** = step-up required · **—** = N/A

| Capability | P-APP | P-HM | P-REV | P-HR | P-ADM | P-CON | P-REC |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `public.job.read` | Y | Y | Y | Y | Y | Y | Y |
| `application.submit` | Y | N | N | N | N | N | N |
| `application.receipt.read` (own) | Y+S* | N | N | N | N | N | N |
| `application.correct` (own) | Y+S | N | N | N | N | N | N |
| `privacy.request` (own) | Y+S | N | N | N | N | N | N |
| `accommodation.request` (own) | Y | N | N | N | N | N | N |
| `listing.draft` | N | Y | N | Y | Y | D | N |
| `listing.import` | N | N | N | Y | Y | D | N |
| `listing.audit.run` | N | N | N | Y | Y | D | N |
| `requirements.approve` | N | N | N | Y | N | N | N |
| `compensation.approve` | N | N | N | Y | N | N | N |
| `rubric.approve` | N | N | N | Y | N | N | N |
| `publication.approve` | N | N | N | Y | N | N | N |
| `page_release.publish` | N | N | N | Y | Y† | D† | N |
| `application.review.read` | N | Limited‡ | Y | Y | N | D | N |
| `decision.record` | N | N | Y | Y§ | N | N | N |
| `milestone.record` | N | Y‖ | Y | Y | N | D | N |
| `start.confirm` | N | N | Y | Y | N | N | N |
| `qualified_hire.confirm` | N | N | Y | Y | N | N | N |
| `campaign.csv.import` | N | N | N | Y | Y | D | N |
| `campaign.reconcile.view` | N | N | N | Y | Y | D | Y |
| `ats.mapping.edit` | N | N | N | Y | Y | D | N |
| `ats.export.trigger` | N | N | N | Y | Y | D | Y |
| `analytics.tenant.read` | N | Limited | Limited | Y | Y | D | Y |
| `member.manage` | N | N | N | Y | Y | N | N |
| `delegation.grant` (dealer) | N | N | N | Y | Y | N | N |
| `ops.inspect` | N | N | N | N | N | Limited | Y |
| `ops.replay` | N | N | N | N | N | N | Y |
| `ops.kill_switch` | N | N | N | N | N | N | Y |
| `compliance_vault.read` | N | N | N | N | N | N | Restricted¶ |
| `candidate_ai.shadow.read` | N | N | N | N | N | N | N** |
| `cross_tenant.benchmark.read` | N | N | N | N | N | N | N |

\* Receipt via public ID may be limited; sensitive fields require magic-link + step-up.  
† Technical publish of already-approved `JobControlVersion` / release pointer only.  
‡ Pipeline status without full resume/evidence matrix unless granted.  
§ HR may record when also acting as reviewer; still needs reviewer training attestation for qualification.  
‖ Interview/offer scheduling notes only; not disposition.  
¶ Only for approved compliance analysis jobs; never joins to decision UIs.  
\*\* Shadow AI inaccessible to all decision UIs in beta—including recovery ops screens used for hiring decisions.

## 4. Action matrix (detailed)

### 4.1 Public / applicant

| Action | Capability | Tenant | Rooftop | Purpose | Delegation | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| View published job | `public.job.read` | From PageRelease | From release | `publication` | — | English PageRelease only |
| Submit application | `application.submit` | Job’s tenant | Job’s rooftop | `hiring` + notice plane | — | Idempotency key required |
| View own receipt | `application.receipt.read` | Own | Own | `subject` | — | Step-up for sensitive |
| Request correction | `application.correct` | Own | Own | `subject` | — | Reopens dependent decisions |
| File privacy request | `privacy.request` | Own | Own | `subject` | — | |
| Request accommodation | `accommodation.request` | Own | Own | `subject` | — | No medical detail oversharing |

### 4.2 Listing → publication

| Action | Capability | Purpose | Who | Invariant |
| --- | --- | --- | --- | --- |
| Create/edit draft listing | `listing.draft` | `hiring` | HM, HR, ADM, CON+D | Material edit invalidates approvals |
| Import source records | `listing.import` | `hiring` | HR, ADM, CON+D | Preserve provenance; no silent overwrite |
| Run audit | `listing.audit.run` | `hiring` | HR, ADM, CON+D | Findings classes visible |
| Approve requirements | `requirements.approve` | `hiring` | **HR only** | I-01 |
| Approve compensation | `compensation.approve` | `hiring` | **HR only** | Min/max + structure required |
| Approve rubric | `rubric.approve` | `hiring` | **HR only** | Version pinned |
| Approve publication | `publication.approve` | `hiring`+`publication` | **HR only** | Effect manifest |
| Switch PageRelease pointer | `page_release.publish` | `publication` | HR/ADM/CON+D | Only if publication approved |

### 4.3 Review → start

| Action | Capability | Purpose | Who | Forbidden |
| --- | --- | --- | --- | --- |
| Open evidence matrix | `application.review.read` | `hiring` | REV, HR, CON+D | AI labels, demos vault |
| Record DecisionRecord | `decision.record` | `hiring` | REV (trained) | Auto-reject |
| Record milestones | `milestone.record` | `hiring` | REV, HR, HM(limited) | |
| Confirm start | `start.confirm` | `hiring` | REV, HR | |
| Confirm qualified hire | `qualified_hire.confirm` | `hiring` | REV, HR | Requires rubric version match |

### 4.4 Campaigns / ATS / analytics

| Action | Capability | Purpose | Who | Claim class |
| --- | --- | --- | --- | --- |
| Import ads CSV | `campaign.csv.import` | `hiring` | ADM, HR, CON+D | Descriptive after reconcile |
| View reconcile state | `campaign.reconcile.view` | `hiring` | ADM, HR, CON+D, REC | Show Fresh/Stale/NeedsReconciliation |
| Edit ATS mapping | `ats.mapping.edit` | `hiring` | ADM, HR, CON+D | |
| Trigger ATS export | `ats.export.trigger` | `hiring` | ADM, HR, CON+D, REC | ExportReceipt required |
| Read tenant analytics | `analytics.tenant.read` | `hiring` | Role-scoped | Operational/descriptive only |

### 4.5 Platform recovery

| Action | Capability | Purpose | Who | Guard |
| --- | --- | --- | --- | --- |
| Inspect envelope/state | `ops.inspect` | `platform` | REC (CON limited) | No PII in logs |
| Replay ingest/outbox | `ops.replay` | `platform` | REC | Audited |
| Kill switch intake/campaigns | `ops.kill_switch` | `platform` | REC | Always available |
| Compliance vault query | `compliance_vault.read` | `compliance_vault` | Restricted | Never in decision UI |

## 5. Explicit denials (always N in beta)

| Denied capability | Reason |
| --- | --- |
| Show candidate AI to any decision-maker | I-06 / shadow-only |
| Decision-maker access to protected demographics | I-07 |
| Operator approve req/pay/rubric/publication | I-01 |
| Live ad API actuation from UI | Deferred |
| Cross-tenant benchmark widgets | Deferred / I-11 |
| Causal “lift/effect” labels | I-11 |
| SMS send | Deferred |
| Prior pay collection fields | Architecture exclude |
| FCRA enrichment panels | Hard boundary |

## 6. Delegation rules (UI)

When `delegation_id` is present:

1. Persistent banner: **Acting as {on_behalf_of} · expires {ts} · capabilities {list}**.
2. Every mutation stores `actor_id` + `on_behalf_of` + `delegation_id`.
3. Approval actions that are HR-only remain denied even under concierge delegation unless the grant explicitly includes that capability (**beta default: HR approvals not delegable to platform staff**).
4. Expired delegation → hard deny + re-auth prompt.

## 7. Protected demographics access control

| Surface | Access |
| --- | --- |
| Apply form (voluntary block) | Applicant write-only to vault; optional; not required |
| Reviewer evidence matrix | **Hidden** |
| Hiring manager pipeline | **Hidden** |
| HR listing/approval | **Hidden** |
| Analytics hiring dashboards | **Hidden** |
| Segregated compliance report | Restricted capability + purpose + counsel-approved job |

## 8. Candidate AI visibility control

| Consumer | Beta visibility |
| --- | --- |
| Applicant | None |
| Reviewer / HR / HM / Admin | None |
| Concierge | None in hiring UIs |
| Analytics | None |
| Eval harness / offline | Engineering only; not product UI |

## 9. Denial UX contract

Denied actions render:

- Human-readable summary
- Machine reason code (e.g. `AUTH_MISSING_PURPOSE`, `AUTH_HR_APPROVAL_REQUIRED`, `AUTH_DELEGATION_EXPIRED`, `POLICY_MISSING_NEXUS_FACT`)
- Next step (who can grant / what fact to supply)
- No enumeration of other tenants’ existence

## 10. Test obligations

For each **Y** cell above, tests must prove allow path. For each **N** / Denied row, tests must prove deny path including UI. Isolation tests must prove MCP/service identities cannot substitute their own scope for the signed human actor/delegation.
