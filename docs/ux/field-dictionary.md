# Field dictionary — beta

**Version:** 0.1 · **Date:** 2026-07-28  
Canonical fields for listing, compensation, requirements, application, notices, decisions, and metrics.  
Schema-driven forms: **stable core + role-family modules**.

## Legend

| Column | Meaning |
| --- | --- |
| Key | Stable field key |
| Type | Data type |
| Req | Required for the named state |
| Editor / Viewer / Approver | Personas |
| Purpose | Purpose plane |
| Sensitivity | `public` · `internal` · `pii` · `sensitive` · `vault` |
| Provenance | How value is sourced |
| Retention | Class |
| ATS | Mapping eligibility |
| Analytics | Eligible? |
| Prohibited | Forbidden uses |

---

## 1. Listing core (`ListingRevision`)

| Key | Type | Req | Editor | Viewer | Approver | Purpose | Sens. | Provenance | Retention | ATS | Analytics | Prohibited |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `tenant_id` | uuid | always | system | system | — | hiring | internal | system | tenancy | N | N | cross-tenant join in UI |
| `rooftop_id` | uuid | always | system | dealer | — | hiring | internal | system | tenancy | Y | Y | multi-rooftop beta |
| `listing_revision_id` | uuid | always | system | dealer | — | hiring | internal | system | hiring | Y | Y | silent overwrite |
| `title` | string | draft | HM/HR | all dealer | HR pub | hiring | public* | human/import | hiring | Y | Y | AI invent |
| `department` | enum | draft | HM/HR | dealer | HR | hiring | public* | human | hiring | Y | Y | |
| `job_family` | enum | draft | HM/HR | dealer | HR | hiring | public* | human | hiring | Y | Y | unvalidated family live |
| `occupation_codes` | string[] | review | HR | dealer | HR | hiring | internal | mapped | hiring | optional | Y | |
| `location_city` | string | draft | HM/HR | public* | HR | hiring | public* | human | hiring | Y | Y | |
| `location_state` | enum=`NY` | draft | locked | public* | HR | hiring | public* | system/policy | hiring | Y | Y | non-NY |
| `remote_allowed` | bool=`false` | draft | locked | public* | — | hiring | public* | policy | hiring | Y | Y | true in beta |
| `description_html` | richtext | draft | HM/HR | public* | HR | hiring | public* | human | hiring | Y | limited | unsafe HTML |
| `schedule_summary` | string | review | HM/HR | public* | HR | hiring | public* | human | hiring | Y | Y | |
| `urgency` | enum | optional | HM | dealer | — | hiring | internal | human | hiring | N | Y | candidate display |
| `must_have_vs_trainable_notes` | text | optional | HM | dealer | — | hiring | internal | human | hiring | N | N | auto-reject fuel |
| `locale` | enum=`en` | always | locked | public | — | publication | public | system | pub | Y | Y | es in beta |
| `source_import_batch_id` | uuid | if import | system | dealer | — | hiring | internal | import | hiring | N | Y | erase provenance |

\* Public only after PageRelease.

---

## 2. Compensation (required for publication)

Every published role requires **min + max** base/rate **and** applicable structure.

| Key | Type | Req for publish | Editor | Approver | Notes |
| --- | --- | --- | --- | --- | --- |
| `comp.pay_basis` | enum: hourly, salary, flat_rate, book_hour, mixed | Y | HR | HR | |
| `comp.currency` | enum=`USD` | Y | locked | HR | |
| `comp.base_min` | decimal | Y | HR | HR | Min ≤ max; AI never invents |
| `comp.base_max` | decimal | Y | HR | HR | Displayed on public page |
| `comp.base_period` | enum: hour, week, month, year, flat_rate_hour | Y | HR | HR | |
| `comp.structure.flat_rate` | bool + details | if applicable | HR | HR | |
| `comp.structure.guarantee` | money/period | if applicable | HR | HR | |
| `comp.structure.draw` | money/period | if applicable | HR | HR | |
| `comp.structure.commission` | text/schema | if applicable | HR | HR | No prior-pay ask |
| `comp.structure.bonus` | text/schema | if applicable | HR | HR | |
| `comp.structure.overtime` | enum/policy | if applicable | HR | HR | |
| `comp.structure.benefits_summary` | text | recommended | HR | HR | Channel truncation checked |
| `comp.disclosure_text_version` | copy ID | Y | counsel | — | `COPY-PAY-01` family |
| `comp.approved_at` | ts | Y | system | HR | |
| `comp.approver_id` | uuid | Y | system | HR | |

**Prohibited fields:** `prior_compensation`, `current_employer_pay`, candidate salary history.

---

## 3. Requirements (`RequirementVersion`)

| Key | Type | Req | Editor | Approver | Purpose | Sens. | Prohibited |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `req.id` | uuid | Y | system | — | hiring | internal | |
| `req.label` | string | Y | HR | HR | hiring | public* | vague proxies without review |
| `req.essential_function` | text | Y | HR | HR | hiring | internal | |
| `req.business_necessity` | text | Y | HR | HR | hiring | internal | |
| `req.acceptable_equivalents` | string[] | Y | HR | HR | hiring | public* | |
| `req.accommodation_handling` | text | Y | HR | HR | hiring | internal | medical diagnoses |
| `req.protected_proxy_review` | enum: clear, flagged, waived_documented | Y | HR | HR | hiring | internal | skip for language/tools proxies |
| `req.evidence_hint` | text | optional | HR | — | hiring | internal | AI auto-fill to reviewer |
| `req.effective_at` / `expires_at` | ts | Y | system | HR | hiring | internal | |

Role-family modules add typed rows (ASE certs, OEM certs, CDL, tools, languages, etc.) under the same keys.

---

## 4. Application (structured + envelope)

### 4.1 Client / envelope metadata

| Key | Type | Req | Sens. | Notes |
| --- | --- | --- | --- | --- |
| `idempotency_key` | uuid | Y | internal | Client-generated |
| `application_public_id` | string | Y | internal | Non-secret |
| `job_control_version_id` | uuid | Y | internal | Pinned at apply |
| `page_release_id` | uuid | Y | internal | |
| `jurisdiction_snapshot_id` | uuid | Y | internal | |
| `notice_manifest_hash` | hash | Y | internal | Exact notices shown |
| `submitted_at` | ts | Y | internal | Envelope time |
| `resume_state` | enum | Y | internal | `Linked`·`PendingUpload`·`Quarantined`·`None` |
| `resume_content_hash` | hash | if file | sensitive | |

### 4.2 Applicant-provided core

| Key | Type | Req | Sens. | ATS | Analytics | Prohibited |
| --- | --- | --- | --- | --- | --- | --- |
| `applicant.legal_name` | string | Y | pii | Y | N raw | logs |
| `applicant.email` | email | Y | pii | Y | N raw | |
| `applicant.phone` | phone | optional beta | pii | Y | N | SMS without gate |
| `applicant.city` / `state` | string | recommended | pii | Y | coarse only | ZIP targeting misuse |
| `applicant.work_authorization` | enum | per policy | sensitive | Y | N | overcollection |
| `applicant.experience_summary` | text | optional | pii | Y | limited | |
| `applicant.answers.{req_id}` | text/bool/enum | per req | pii | Y | limited | AI disposition |
| `applicant.resume_file` | file | optional* | sensitive | Y | N | external raw model |

\* Optional if degraded path; encouraged when R2 healthy.

### 4.3 Voluntary compliance vault (segregated)

| Key | Type | Req | Sens. | Viewer decision-makers | Analytics |
| --- | --- | --- | --- | --- | --- |
| `vault.eeo_*` | enums | N | vault | **Never** | compliance_vault only |
| `vault.disability_self_id` | enum | N | vault | **Never** | compliance_vault only |
| `vault.veteran_status` | enum | N | vault | **Never** | compliance_vault only |

Not required to apply. Separate purpose. No inference.

---

## 5. Notices & authority

| Key | Type | Req | Record | Notes |
| --- | --- | --- | --- | --- |
| `notice.terms_version` | copy ID | Y | NoticeReceipt | `COPY-TERMS-01` |
| `notice.privacy_version` | copy ID | Y | NoticeReceipt | `COPY-PRIVACY-01` |
| `notice.ai_version` | copy ID | Y | NoticeReceipt | Shadow notice still versioned |
| `notice.accommodation_version` | copy ID | Y | NoticeReceipt | |
| `permission.email_transactional` | bool | Y (implicit transactional) | PermissionGrant / CommAuth | Evaluated enqueue+dispatch |
| `permission.marketing_optional` | bool | N | PermissionGrant | Never condition of apply |
| `authority.data_use` | struct | Y | DataUseAuthority | Controller/purpose/retention |

Do not collapse into one `ConsentEntry`.

---

## 6. Decision & milestone records

| Key | Type | Req | Editor | Sens. | Notes |
| --- | --- | --- | --- | --- | --- |
| `decision.id` | uuid | Y | system | internal | |
| `decision.application_id` | uuid | Y | system | internal | |
| `decision.reviewer_id` | uuid | Y | REV | internal | Trained |
| `decision.matrix.{req_id}.status` | enum: present, absent_unknown, verified_adverse, needs_verify | Y | REV | internal | No AI labels |
| `decision.rationale` | text | Y | REV | sensitive | Independent |
| `decision.disposition` | enum | Y | REV | internal | |
| `decision.system_reliance_disclosure` | enum | Y | REV | internal | Manual path = none/AI |
| `decision.rubric_version_id` | uuid | for QH | REV/HR | internal | Exact version |
| `milestone.type` | enum | Y | REV/HM/HR | internal | exposure…start |
| `milestone.at` | ts | Y | actor | internal | |
| `milestone.start_confirmed` | bool | for QH | REV/HR | internal | |
| `milestone.y90_optional` | enum | N | HR | internal | Future aggregate only; not candidate feature |

---

## 7. Metrics (versioned definitions)

### 7.1 Qualified hire

| Key | Definition |
| --- | --- |
| `metric.qualified_hire` | `true` iff (a) dealer confirms exact versioned qualification rubric for the HiringCase **and** (b) candidate `start_confirmed` |
| `metric.qualified_hire.rubric_version_id` | Must match approved rubric on JobControlVersion lineage |
| `metric.qualified_hire.claim_class` | Descriptive / report-only in beta |

### 7.2 Clock

| Key | Definition |
| --- | --- |
| `metric.clock_start` | Timestamp of `JobControlVersion` **approval** (publication authority) |
| `metric.clock_end` | Timestamp of confirmed start |
| `metric.time_to_qualified_hire` | `clock_end - clock_start` for qualified hires |
| `metric.timezone` | Rooftop local TZ from facts |

### 7.3 Cost

| Key | Definition |
| --- | --- |
| `metric.cost.ad_spend_attributable` | Reconciled imported ad spend allocated to job/campaign per metric version rules |
| `metric.cost.campaign_service_allocated` | Explicitly allocated managed-service/SaaS campaign-service cost (not inferred) |
| `metric.cost.total` | `ad_spend_attributable + campaign_service_allocated` |
| `metric.cost_per_qualified_hire` | `cost.total / count(qualified_hire)` for mature cohort |
| Language | **Allocated to / associated with** — never causal lift |

### 7.4 Metric version metadata (required on dashboards)

| Key | Meaning |
| --- | --- |
| `metric_version_id` | Definition pin |
| `cohort_id` | Population |
| `attribution_window` | Rules |
| `freshness` | Fresh / ObservedZero / Missing / Stale |
| `reconciled` | bool |
| `claim_class` | operational \| descriptive |
| `maturity` | e.g. open vs closed cohort |

---

## 8. Campaign CSV fields (import)

| Key | Type | Req | Notes |
| --- | --- | --- | --- |
| `csv.account_id` | string | Y | Dealer-owned |
| `csv.campaign_external_id` | string | Y | |
| `csv.job_control_version_id` | uuid | Y | Binding |
| `csv.date` | date | Y | |
| `csv.spend` | decimal | Y | |
| `csv.impressions` / `clicks` / `applications` | int | as provided | ObservedZero allowed |
| `csv.source` | enum: meta, google | Y | |
| `csv.import_attestation` | bool | Y | Manual/signed |

Ambiguous rows → `NeedsReconciliation`, not silent admit as actuation.

---

## 9. Validation rules (cross-field)

1. `comp.base_min` ≤ `comp.base_max`.  
2. `remote_allowed` must be false in beta.  
3. `location_state` must be `NY`.  
4. Publication blocked if any `req.protected_proxy_review=flagged` without waiver.  
5. Envelope requires notice hashes + job_control_version_id.  
6. Qualified hire requires rubric version equality.  
7. Vault fields never projected into hiring purpose queries.

## 10. Change control

Field key renames require dictionary version bump, ATS mapping review, and analytics admission update.
