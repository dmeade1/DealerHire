# New York design-partner dossier

**Document status:** Active template  
**Live partner status:** **`NO LIVE PARTNER SELECTED`**  
**Last updated:** 2026-07-28

Use one dossier per candidate. Promote exactly one dossier to `SELECTED` before claiming G0 partner readiness. Keep synthetic and live records clearly separated.

---

## 1. Dossier control block

| Field | Value |
| --- | --- |
| Dossier ID | `DH-NY-PARTNER-000` (template / synthetic) |
| Partner class | `SYNTHETIC` (engineering skeleton only) — **or** `LIVE` when a real partner is chosen |
| Selection status | `NO LIVE PARTNER SELECTED` |
| Rooftop in beta scope | One rooftop only |
| Primary language (beta) | English |
| Publication host | Managed DealerHire platform subdomain |
| Remote / multi-state jobs | **Excluded** from beta |
| Changelog | See [§9](#9-changelog) |

### Selection status values

`Draft` → `Candidate` → `Diligence` → `SELECTED` → `Active beta` → `Withdrawn` / `Superseded`

**Current live track:** no dossier in `SELECTED`.  
**Current synthetic track:** profile below is `SYNTHETIC` for fixtures only.

---

## 2. SYNTHETIC partner profile (engineering skeleton only)

> **WARNING — SYNTHETIC DATA**  
> The following organization is **fictional**. It exists solely so engineering can build tenant/rooftop fixtures, policy-pack plumbing, and the no-PII walking skeleton.  
> It is **not** a customer, **not** a design-partner commitment, and **must not** be used to mark live readiness checklist Sections A–F as `Pass` or to satisfy Gate G0’s live partner criterion.

### 2.1 Identity

| Field | SYNTHETIC value |
| --- | --- |
| Dealer group legal name | North Atlantic Motors Group, LLC |
| DBA | North Atlantic Motors |
| Group code (fixture) | `namg` |
| Rooftop name | Albany Service Center |
| Rooftop code (fixture) | `namg-albany-svc` |
| Street address | 4200 Central Avenue |
| City | Albany |
| County | Albany County |
| State | New York |
| ZIP | 12205 |
| MSA / market label | Capital Region |
| Timezone | `America/New_York` |
| Website (fictional) | `https://example.invalid/north-atlantic-motors` |
| Primary brands (fixture) | Multi-franchise service-oriented rooftop (OEM labels in fixtures only) |

### 2.2 Why this synthetic nexus

| Question | SYNTHETIC answer |
| --- | --- |
| NY State? | **Yes** |
| New York City? | **No** (Albany — non-NYC) |
| Remote jobs in beta? | **No** — on-site rooftop roles only |
| Role coverage planned in fixtures | **Technicians** plus **all dealership role families** (sales, F&I, service advisors, parts, detail, BDC, office/admin, management) as schema/acceptance skeletons |
| Purpose | Drive jurisdiction resolver paths for **NY State non-NYC** without implying NYC LL144 applicability |

### 2.3 SYNTHETIC accountable users (fixtures)

| Role | SYNTHETIC name | Notes |
| --- | --- | --- |
| Executive / HR sponsor | Alex Rivera, VP People | Fixture user only |
| Listing / pay approver | Jordan Lee, Fixed Ops Director | Fixture user only |
| Trained reviewer 1 | Sam Okonkwo, Service Manager | Fixture user only |
| Trained reviewer 2 | Casey Nguyen, Talent Coordinator | Fixture user only |
| ATS technical contact | Riley Chen, IT Systems Lead | Fixture user only |
| Meta/Google ops contact | Morgan Blake, Marketing Manager | Fixture user only |
| DealerHire concierge | _Assign real internal owner_ | Real human for engineering demos |

### 2.4 SYNTHETIC operating facts (for resolver tests)

These are **fixture defaults**, not legal advice and not transferable to a live partner.

| Fact | SYNTHETIC default | Resolver intent |
| --- | --- | --- |
| Employee count (entity) | 180 | Above common transparency thresholds |
| Employee count (establishment) | 62 | Rooftop-level testing |
| Federal contractor | No | Baseline non-OFCCP path |
| Government employer | No | Private dealer |
| Union coverage (in-scope roles) | No | Non-union baseline |
| Remote-work for beta jobs | Forbidden | Matches beta exclusion |
| OEM / franchise | Franchise service rooftop; OEM hiring claim rules stubbed | OEM/franchise flag true |
| Recordkeeping | 3-year application retention stub | Retention floor tests |
| NYC nexus | False | Non-NYC pack |
| Other local packs | None beyond NY State + Albany County stub | County stub may be no-op until counsel defines live packs |

### 2.5 SYNTHETIC systems

| System | SYNTHETIC assumption |
| --- | --- | --- |
| ATS | Generic CSV + signed webhook first; named connectors unset |
| Historical data | Generated fixture jobs/outcomes (no real candidates) |
| Meta / Google | Synthetic CSV campaign receipts only |
| Email | Transactional test providers / sandboxes |

### 2.6 Labeling rules for synthetic artifacts

Every export, screenshot, demo, ADR example, and seed row that uses this profile must include one of:

- prefix `SYNTHETIC:`
- tenant attribute `partner_class = synthetic`
- watermark in UI demos: `SYNTHETIC — NOT A CUSTOMER`

Do not reuse these email domains or names for live environments.

---

## 3. Live partner profile (template — empty until selected)

Fill this section when a real candidate enters diligence. Leave blank while status is `NO LIVE PARTNER SELECTED`.

### 3.1 Identity

| Field | Live value |
| --- | --- |
| Dealer group legal name | |
| DBA | |
| Group code | |
| Rooftop name | |
| Rooftop code | |
| Street address | |
| City / County / State / ZIP | |
| NYC borough (if any) | |
| Timezone | `America/New_York` (expected) |
| OEM brands / franchise | |
| Primary contact | |

### 3.2 Accountable users

| Role | Name | Title | Email | Phone | Trained? |
| --- | --- | --- | --- | --- | --- |
| Executive / HR sponsor | | | | | |
| Listing / pay approver | | | | | |
| Trained reviewer 1 | | | | | |
| Trained reviewer 2 | | | | | |
| ATS technical contact | | | | | |
| Meta ops | | | | | |
| Google ops | | | | | |
| Privacy / rights contact | | | | | |

### 3.3 Weekly UAT

| Field | Value |
| --- | --- |
| Cadence | Weekly |
| Day / time (ET) | |
| Attendees (required) | |
| Facilitation owner (DealerHire) | |
| Artifact location (notes, recordings policy) | |

### 3.4 Data and ATS

| Field | Value |
| --- | --- |
| Current ATS | |
| Export format / API | |
| Historical jobs date range | |
| Outcome fields available | |
| Connector preference #1 / #2 | See [ats-connector-selection.md](./ats-connector-selection.md) |

### 3.5 Ad accounts

| Field | Value |
| --- | --- |
| Meta BM / ad account IDs | |
| Google account IDs | |
| Billing owner | Dealer (required) |
| CSV export owners | |
| API application status | |

### 3.6 Operating facts summary

Link the completed [operating-facts-questionnaire.md](./operating-facts-questionnaire.md). Paste roll-up:

| Fact | Value | As-of | Source |
| --- | --- | --- | --- |
| Employee count (entity / establishment) | | | |
| Federal contractor | | | |
| Government / union | | | |
| Remote-work beta policy | Non-remote only | | |
| OEM / franchise | | | |
| Recordkeeping | | | |
| Local nexus | | | |

---

## 4. Nexus resolution process

Exact nexus controls the first allowlisted policy pack. **Do not** enable features on a vague “New York” flag.

### 4.1 Principles

1. **Fail closed.** Missing nexus facts block publication, campaigns, AI, tracking, communications, export, and decision support.
2. **Effective-dated packs.** Obligations are versioned policy data, not prompt text.
3. **At-use re-evaluation.** Constraints re-check at execution, not only at listing creation.
4. **Counsel-owned legal conclusions.** Engineering implements packs; counsel decides applicability.
5. **Beta exclusions.** Remote and multi-state jobs are out of scope regardless of nexus.

### 4.2 Resolution steps (exact sequence)

| Step | Action | Output | Owner | Exit criterion |
| --- | --- | --- | --- | --- |
| N1 | Capture **employer facts** from questionnaire (entity, counts, contractor, union, OEM, recordkeeping) | Facts record `EmployerFactsVersion` | Program + sponsor | No `Unknown` on mandatory fields |
| N2 | Capture **job location** = beta rooftop physical address; affirm on-site | `JobLocation` (lat/long optional; address required) | Program | Address verified against rooftop |
| N3 | Determine **state pack**: New York State | `JurisdictionRef = US-NY` | Eng + counsel | State pack candidate identified |
| N4 | Determine **NYC applicability** | Boolean + rationale | Counsel | Explicit Yes/No/Conditional memo |
| N5 | If NYC = Yes, inventory **NYC-local** obligations (e.g., pay transparency local rules; AEDT/LL144 **only if** a feature qualifies) | Local obligation list | Counsel | List attached to dossier |
| N6 | If NYC = No, inventory **other local** packs (city/county) that counsel says apply | Local obligation list or “none” | Counsel | Written “none” is acceptable |
| N7 | Determine **candidate-residence** collection policy (collect only if legitimate and needed) | Collection decision | Counsel + product | Default: minimize |
| N8 | Determine **ad geography** constraints for Meta/Google | Geo allowlist | Program + counsel | Matches NY rooftop targeting |
| N9 | Map facts → **immutable obligation manifest** schema | Manifest draft | Eng | Machine-readable draft |
| N10 | Counsel validates manifest → issues **implementation packet** | Signed/approved packet | Counsel | Packet version ID |
| N11 | Bind first **allowlisted policy pack** to tenant/rooftop | `PolicyPackVersion` | Eng | Pack fails closed outside nexus |
| N12 | Assign **role allocation** duties (notice, rights, retention, incident, audit, decisions) | `RoleAllocationVersion` | Counsel | No unassigned duty |
| N13 | Record nexus decision in this dossier + readiness checklist E1–E5 | Dossier §4.3 | Program | Checklist E bundle `Pass` |

### 4.3 Nexus decision record (live — empty)

| Field | Value |
| --- | --- |
| Decision date | |
| State | New York |
| NYC applicable? | |
| Other local packs | |
| Policy pack version ID | |
| Role allocation version ID | |
| Counsel memo link | |
| Engineering implementer | |
| Revisit triggers | Address change; new rooftop; remote job request; feature that may be AEDT; employee-count threshold cross |

### 4.4 Nexus decision record (SYNTHETIC — skeleton)

| Field | SYNTHETIC value |
| --- | --- |
| Decision date | 2026-07-28 (fixture) |
| State | New York |
| NYC applicable? | **No** |
| Other local packs | Albany County stub (non-operative until counsel defines live rules) |
| Policy pack version ID | `pack-us-ny-non-nyc-synthetic-000` |
| Role allocation version ID | `roles-synthetic-000` |
| Counsel memo | **Not applicable** — synthetic; do not treat as counsel approval |
| Revisit | Replace entirely when live partner selected |

### 4.5 NYC / AEDT note

- Non-NYC rooftops still need an explicit **NYC = No** determination so engineering does not accidentally load NYC packs.
- NYC Local Law 144 and similar AEDT rules apply **when a feature qualifies**, not merely because the partner is in NYC. Candidate AI remains **shadow-only** in beta; any regulated-use path requires a separate `EmploymentAIUse` gate.
- Live partner in NYC changes the packet; do not reuse the synthetic Albany determination.

---

## 5. Readiness checklist attachment

- Live candidates: complete [readiness-checklist.md](./readiness-checklist.md) and paste the roll-up status here.
- Synthetic: Section G only; Sections A–F remain `Not started` / pending external selection.

**Live checklist roll-up:** `Pending — no live partner selected`  
**Synthetic checklist roll-up:** Section G `Pass` (skeleton only)

---

## 6. Risks and open questions

| ID | Risk / question | Severity | Owner | Status |
| --- | --- | --- | --- | --- |
| R1 | No live partner selected blocks G0 partner criterion and live policy pack | High | Program owner | Open |
| R2 | ATS connectors cannot be named until partner demand/access | Medium | Program + eng | Open |
| R3 | Employee-count / federal-contractor unknowns fail closed | High | Sponsor + counsel | Open (live) |
| R4 | Accidental promotion of SYNTHETIC Albany profile to live | High | Program owner | Mitigated by labeling |
| R5 | NYC misclassification | High | Counsel | Open (live) |

---

## 7. Approval to select (live only)

| Role | Name | Date | Signature / ack |
| --- | --- | --- | --- |
| Partner executive sponsor | | | |
| DealerHire program owner | | | |
| Counsel (nexus packet) | | | |

**Selection decision:** _Not taken — NO LIVE PARTNER SELECTED_

---

## 8. Engineering consumption guide

| Consumer | Live partner | SYNTHETIC partner |
| --- | --- | --- |
| Tenant seed | Real IDs after G0/G2 rules | `namg` / `namg-albany-svc` |
| Policy pack | Counsel-approved pack | `pack-us-ny-non-nyc-synthetic-000` |
| PII | Forbidden until G2 | Never use real PII |
| UAT | Weekly with sponsor | Internal only |
| G0 partner criterion | Required for `Pass` | Does not satisfy |
| G1 skeleton | Optional | Primary path |

---

## 9. Changelog

| Date | Change | Author |
| --- | --- | --- |
| 2026-07-28 | Created dossier template; recorded NO LIVE PARTNER SELECTED; added SYNTHETIC North Atlantic Motors Group / Albany Service Center | Program docs |
