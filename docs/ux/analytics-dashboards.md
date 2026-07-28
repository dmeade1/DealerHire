# Analytics dashboards — beta

**Version:** 0.1 · **Date:** 2026-07-28  
**Contract:** Tenant-local · role-scoped · operational or descriptive only · mixed freshness · reconciled before business use · no cross-tenant first-party benchmarks · outcomes report-only.

Every tile shows: **title · value · as-of · FreshnessBadge · ClaimClassBadge · metric_version_id · COPY-ANALYTICS-CLAIM-01**.

---

## 1. Global rules

| Rule | Spec |
| --- | --- |
| Isolation | RLS + purpose; UI never offers tenant switch for dealers |
| Freshness | Operational health may be near-real-time; funnel/business hourly or daily **after reconcile** |
| Stale analytical | Show Stale + suppress advice (beta: no advice engine; still label) |
| ObservedZero vs Missing | Distinct badges |
| Language | associated with / allocated to — never caused/lift |
| Qualified hire | Rubric confirmed + start confirmed |
| Clock | JCV approval → start |
| Cost | attributable ad spend + allocated campaign-service cost |
| Y90 | Optional capture; not on optimization tiles; not candidate-level |
| Demographics | Absent from all hiring dashboards |
| Candidate AI | Absent |

---

## 2. Hub — `/app/analytics` (SCR-AN-01)

| Module | Audience | Claim | Freshness target |
| --- | --- | --- | --- |
| Attention strip | HR/ADM | operational | near-RT |
| Listing health summary | HR | descriptive | hourly |
| Campaign spend summary | HR/ADM | descriptive | after CSV reconcile |
| Funnel snapshot | HR | descriptive | hourly/daily |
| Quality (QH) snapshot | HR | descriptive | daily |
| Platform deps (dealer-visible subset) | ADM | operational | near-RT |

---

## 3. Listing dashboard — `/app/jobs/{id}/analytics` + hub cards

**Purpose:** Listing quality, policy readiness, publication state—not candidate ranking.

| Tile | Definition | Claim | Freshness | Notes |
| --- | --- | --- | --- | --- |
| Audit open blockers | Count hard findings on current revision | operational | near-RT | |
| Time in ReviewReady | Hours waiting on HR approval | operational | near-RT | |
| PageRelease state | Live/Preview/Tombstone | operational | near-RT | |
| Public exposures | Admitted exposure events | descriptive | hourly | |
| Apply starts / accepts | Starts vs envelope accepts | descriptive | hourly | |
| Pay disclosure present | Boolean for published | operational | near-RT | Must be true if live |
| Role family | Label | — | — | Taxonomy validation context |

**Absent:** “AI listing score”, cross-dealer pay percentiles as actionable advice (benchmarks deferred).

---

## 4. Campaign dashboard — `/app/campaigns` + job-scoped

| Tile | Definition | Claim | Freshness |
| --- | --- | --- | --- |
| Spend (reconciled) | Sum admitted CSV spend allocated to job/campaign | descriptive | post-reconcile |
| Impressions / clicks | Imported | descriptive | post-reconcile |
| Delivery liveness | Fresh/Zero/Missing/Stale | operational | near-RT |
| NeedsReconciliation count | Open cases | operational | near-RT |
| Cost allocated | Ad + service allocation | descriptive | daily |
| Employment SAC compliance checklist | Manual attest state | operational | on change |

**CSV import result panel:** Admitted / Quarantined rows / Rejected with reasons.

---

## 5. Funnel dashboard — `/app/analytics/funnel`

Milestones (distinct observations):

1. Exposure  
2. Application accepted (envelope)  
3. Human review started  
4. Contact requested / delivered  
5. Interview scheduled / completed  
6. Offer issued / accepted / declined  
7. Confirmed start  
8. Qualified hire (derived)

| Tile | Definition | Claim | Freshness |
| --- | --- | --- | --- |
| Cohort funnel table | Counts by stage | descriptive | hourly/daily |
| Conversion stage→stage | Ratios | descriptive | daily |
| Time in stage (p50/p90) | Hours | descriptive | daily |
| Duplicate/reopen policy note | Metric version text | — | — |

Missing outcomes shown as Missing, not zero, unless ObservedZero.

---

## 6. Recruiter operations — `/app/analytics/recruiters`

| Tile | Definition | Claim | Freshness |
| --- | --- | --- | --- |
| Queue depth | Applications awaiting review | operational | near-RT |
| Median first-review latency | Accept → first DecisionRecord | descriptive | hourly |
| Corrections open | CorrectionHold count | operational | near-RT |
| Reviewer workload | Cases per reviewer | descriptive | daily |
| SLA breaches (partner-defined) | Optional threshold | operational | near-RT |

No ranking of candidates; reviewers listed as operators only.

---

## 7. Compliance dashboard — `/app/analytics/compliance`

**Allowed:** notice delivery evidence, permission grants/withdrawals, policy pack version, blocked-fact codes, accommodation case counts (no medical detail), retention/legal-hold flags (counts).

| Tile | Claim | Freshness |
| --- | --- | --- |
| Notice versions in force | operational | near-RT |
| Applies with complete notice manifest | descriptive | hourly |
| Privacy requests open/closed | operational | near-RT |
| Accommodation requests open | operational | near-RT |
| Fail-closed blocks active | operational | near-RT |

**Forbidden tiles:** EEO breakdowns for managers, adverse-impact explorer for HM/REV, vault contents.

---

## 8. Quality / outcomes — `/app/analytics/quality`

| Tile | Definition | Claim | Freshness |
| --- | --- | --- | --- |
| Qualified hires | Count per metric version | descriptive | daily |
| Time to qualified hire | Approval→start | descriptive | daily |
| Cost per qualified hire | cost.total / QH | descriptive | daily |
| Starts without rubric confirm | Count | operational | daily |
| Offer→start conversion | Ratio | descriptive | daily |

Footer must include `COPY-METRIC-QH-01`. Outcomes **do not** deep-link into “optimize campaign” controls in beta.

---

## 9. Platform ops — `/ops/platform-health` (+ dealer-safe subset)

| Tile | Audience | Claim | Freshness |
| --- | --- | --- | --- |
| Intake accept rate | REC (+ dealer subset) | operational | near-RT |
| Envelope→projection lag | REC | operational | near-RT |
| PendingUpload / Quarantined counts | REC | operational | near-RT |
| Queue/DLQ age | REC | operational | near-RT |
| ATS delivery failures | REC/ADM | operational | near-RT |
| Email suppress/fail | REC | operational | near-RT |
| Kill switch state | REC | operational | near-RT |
| Source liveness grid | REC | operational | near-RT |

Synthetic probe status may appear for ops only.

---

## 10. Mixed-freshness presentation pattern

```text
┌──────────────────────────────────────────┐
│ Cost per qualified hire        Descriptive│
│ $X,XXX                                   │
│ As of 2026-07-28 16:00 ET · Fresh        │
│ Metric v12 · Cohort: JCV-…               │
│ Associated/allocated; not causal.        │
│ Reconciled: Yes                          │
└──────────────────────────────────────────┘
```

If `Stale`: value muted; banner “Stale source — do not use for decisions until refreshed.”

If `NeedsReconciliation` upstream: show warning and hide currency tiles or mark provisional.

---

## 11. Role visibility matrix

| Dashboard | HM | REV | HR | ADM | CON | REC |
| --- | --- | --- | --- | --- | --- | --- |
| Listing | limited | — | Y | Y | Y | Y |
| Campaign | — | — | Y | Y | Y | Y |
| Funnel | limited | limited | Y | Y | Y | Y |
| Recruiter | — | own* | Y | Y | Y | Y |
| Compliance | — | — | Y | limited | limited | Y |
| Quality | — | — | Y | Y | Y | Y |
| Platform ops | — | — | subset | subset | limited | Y |

\* Reviewer may see personal queue latency, not full payroll-style surveillance without HR.

---

## 12. Acceptance tests (analytics)

| ID | Proof |
| --- | --- |
| AT-AN-ISO-01 | User A cannot read tenant B tiles |
| AT-AN-CLAIM-01 | No forbidden causal strings in UI bundle |
| AT-AN-QH-01 | QH counts match rubric+start definition |
| AT-AN-FRESH-01 | Stale vs ObservedZero vs Missing distinct |
| AT-AN-RECON-01 | Unreconciled spend not labeled Fresh business-ready |
| AT-AN-VAULT-01 | No demographic fields in hiring dashboards |
| AT-AN-AI-01 | No shadow AI features in payloads |
