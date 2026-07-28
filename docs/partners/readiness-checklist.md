# Design-partner readiness checklist

**Purpose.** Mandatory qualification profile for DealerHire’s first New York design partner. Aligns with the architecture Phase 0 partner requirements and Gate G0.

**How to use.** Copy the status table into the partner dossier, or update statuses in place when a live candidate is under review. Every **Mandatory** row must be `Pass` (or counsel-documented `Waived`) before the G0 partner criterion can pass.

**Overall partner selection status:** `Pending — no live partner selected`

**Last reviewed:** 2026-07-28  
**Reviewer:** _TBD_

---

## Status vocabulary

| Status | Meaning |
| --- | --- |
| `Not started` | No evidence collected |
| `Pending` | In progress; blocking if Mandatory |
| `Pass` | Evidence attached; meets criterion |
| `Fail` | Evidence shows criterion not met |
| `Waived` | Explicit written waiver + owner + expiry; counsel required for legal/operating facts |
| `N/A (synthetic only)` | Applies only to the engineering skeleton partner; never satisfies live G0 |

---

## A. Organizational fit (Mandatory)

| ID | Criterion | Evidence required | Status | Owner | Notes / link |
| --- | --- | --- | --- | --- | --- |
| A1 | Single **New York State** dealer group selected | Legal entity name, DBA, group ID | `Not started` | Program owner | Live partner TBD |
| A2 | Single **NY rooftop** in scope for beta | Rooftop name, street address, city, county, ZIP | `Not started` | Program owner | One rooftop only for beta |
| A3 | Rooftop is **NY State** and beta jobs are **on-site / non-remote** | Job-location policy; confirmation remote/multi-state excluded | `Not started` | HR sponsor | Remote/multi-state = out of beta |
| A4 | Named **executive / HR sponsor** with authority | Name, title, email, phone; authority letter or email | `Not started` | HR sponsor | Approves pay/requirements/rubrics |
| A5 | **Trained reviewers** identified (≥2 recommended) | Names, roles, training plan date | `Not started` | HR sponsor | Human decision owners |
| A6 | **Weekly UAT** commitment through beta certification | Calendar cadence + primary attendees | `Not started` | Concierge + sponsor | Standing weekly slot |
| A7 | Scope includes **technicians and all dealership role families** planned for deep validation | Role inventory acknowledgment | `Not started` | Program owner | All-role requirement before G3 |

---

## B. Data and systems access (Mandatory)

| ID | Criterion | Evidence required | Status | Owner | Notes / link |
| --- | --- | --- | --- | --- | --- |
| B1 | **Historical jobs / outcomes** available | Sample export or access method; date range; fields covered | `Not started` | HR / TA lead | Listings, dispositions, starts preferred |
| B2 | **ATS export and/or API access** confirmed | Export format sample **or** API sandbox credentials plan | `Not started` | Partner tech contact | Feeds connector selection |
| B3 | Named **ATS technical contact** | Name, title, email, phone, escalation path | `Not started` | Partner IT / TA ops | Mapping + webhook owner |
| B4 | Current ATS product and version identified | Vendor, product, tenant ID (if any) | `Not started` | Tech contact | See ATS selection doc |
| B5 | Willingness to use **generic CSV / signed webhook** handoff immediately | Written acknowledgment | `Not started` | Tech contact | Canonical path always ships |
| B6 | Partner demand signal for **two named connectors** | Ranked preference or “evaluate with us” note | `Not started` | Sponsor + tech | Do not lock without demand |

---

## C. Advertising accounts (Mandatory for beta ops; API approval non-blocking)

| ID | Criterion | Evidence required | Status | Owner | Notes / link |
| --- | --- | --- | --- | --- | --- |
| C1 | **Meta** account history / access | Business Manager / ad account IDs; who can export CSV | `Not started` | Marketing / sponsor | Manual CSV first |
| C2 | **Google** Ads (or Jobs) account history / access | Account IDs; export owners | `Not started` | Marketing / sponsor | Manual CSV first |
| C3 | Dealer-owned accounts and **direct platform billing** confirmed | Billing ownership statement | `Not started` | Sponsor | No DealerHire-paid media in beta |
| C4 | Meta/Google **API / verification** application tracked | Application date, status | `Pending` (program) | Program owner | Non-blocking for G0/G3 |

---

## D. Legal and operating facts (Mandatory — fail closed if missing)

These facts feed the jurisdiction resolver and obligation manifest. Missing facts block publication, campaign launch, AI use, display, tracking, communication, export, and decision support.

| ID | Criterion | Evidence required | Status | Owner | Notes / link |
| --- | --- | --- | --- | --- | --- |
| D1 | **Employee-count** facts (entity and, if required, establishment) | Counts + as-of date + counting method | `Not started` | HR / counsel | Thresholds for transparency / OFCCP-adjacent duties |
| D2 | **Federal contractor / OFCCP** status | Yes/No/Unknown→resolved; contract types if Yes | `Not started` | HR / counsel | Unknown is Fail until resolved |
| D3 | **Government / public-sector** employment context | Yes/No; describe if Yes | `Not started` | HR / counsel | Affects policy pack |
| D4 | **Union / collective bargaining** coverage for in-scope roles | Yes/No; units/roles if Yes | `Not started` | HR / counsel | Role-level granularity |
| D5 | **Remote-work** policy for beta jobs | Affirmation: beta jobs are non-remote, single-state NY | `Not started` | HR sponsor | Architecture excludes remote beta |
| D6 | **OEM / franchise** relationships for rooftop | OEM brands; franchise agreements affecting hiring claims | `Not started` | Dealer principal / GM | Claim and listing constraints |
| D7 | **Recordkeeping** practices and retention floors | Current retention schedule; systems of record | `Not started` | HR / counsel | EEOC/OFCCP/state floors |
| D8 | **Local-nexus facts** complete | City, county, NYC applicability, other local packs | `Not started` | Program + counsel | See nexus process in dossier |
| D9 | Completed [operating-facts-questionnaire.md](./operating-facts-questionnaire.md) | Signed/dated questionnaire | `Not started` | Sponsor | Attach to dossier |

---

## E. Nexus resolution (Mandatory)

| ID | Criterion | Evidence required | Status | Owner | Notes / link |
| --- | --- | --- | --- | --- | --- |
| E1 | Job location = rooftop physical location for beta | Address verified | `Not started` | Program owner | |
| E2 | **NYC Local Law / AEDT** applicability determination | Counsel memo: applicable / not applicable / conditional | `Not started` | Counsel | Required even if non-NYC |
| E3 | State pay-transparency and notice pack identified | Pack ID / version planned | `Not started` | Counsel | Effective-dated |
| E4 | First allowlisted **policy pack** scope written | Pack covers exact nexus only | `Not started` | Counsel + eng | Fail closed outside pack |
| E5 | Role-allocation matrix owners assigned for nexus | Dealer vs platform duties table | `Not started` | Counsel | Block launch if unassigned |

---

## F. Accountable owners (Mandatory)

| ID | Criterion | Evidence required | Status | Owner | Notes / link |
| --- | --- | --- | --- | --- | --- |
| F1 | Dealer employment-decision owner named | Name + title | `Not started` | Sponsor | Controller/deployer working allocation |
| F2 | Dealer listing/pay approver named | Name + title | `Not started` | Sponsor | JobControlVersion approver |
| F3 | DealerHire concierge operator named | Name | `Not started` | Program owner | Business-hours support |
| F4 | Recovery / compliance escalation contacts | On-call path (business hours + emergency pause) | `Not started` | Both parties | Kill-switch authority |

---

## G. Synthetic path (engineering skeleton only)

Use only with the labeled synthetic profile in [ny-design-partner-dossier.md](./ny-design-partner-dossier.md).

| ID | Criterion | Evidence required | Status | Owner | Notes / link |
| --- | --- | --- | --- | --- | --- |
| G1 | Synthetic tenant fixtures labeled `SYNTHETIC` | Fixture manifest | `Pass` (template) | Engineering | North Atlantic Motors Group |
| G2 | No live applicant PII in synthetic path | Data policy attestation | `Pass` (policy) | Engineering | G1 gate |
| G3 | Synthetic path **does not** mark checklist Sections A–F as Pass for G0 | Explicit separation in G0 doc | `Pass` (process) | Program owner | Skeleton ≠ partner selection |

---

## Roll-up for Gate G0

| Bundle | Rule | Bundle status |
| --- | --- | --- |
| Live partner (A–F) | All Mandatory rows `Pass` or counsel `Waived` | **`Pending (external selection)`** |
| Synthetic skeleton (G) | G1–G3 `Pass` | **Allowed for skeleton only** |
| G0 partner criterion | Live bundle Pass **or** explicitly deferred with synthetic allowed for pre-repo/skeleton work only | See [../gates/G0-implementation-ready.md](../gates/G0-implementation-ready.md) |

---

## Evidence index

| Artifact | Location | Date |
| --- | --- | --- |
| Questionnaire | _TBD_ | |
| ATS sample export | _TBD_ | |
| Meta/Google access proof | _TBD_ | |
| Counsel nexus memo | _TBD_ | |
| UAT calendar invite | _TBD_ | |
| Sponsor authority email | _TBD_ | |

---

## Sign-off

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Program owner | | | Approve / Reject / Defer |
| Counsel (nexus/facts) | | | Approve / Reject / Defer |
| Partner sponsor | | | Approve / Reject / Defer |

**Decision for live partner readiness:** `Deferred — no live partner selected (2026-07-28)`
