# Gate G0 — Implementation-ready

**Gate ID:** `G0`  
**Purpose:** Decide whether DealerHire may create the production repository and begin the synthetic no-PII walking skeleton under engineering governance.  
**Source of truth:** Architecture plan (automotive labor intelligence) + engineering readiness sequence.  
**Date opened:** 2026-07-28  
**Overall gate status:** **`OPEN — not passed`** (Conditional synthetic proceed recorded; U/A/C Status refreshed 2026-07-29 — no longer “Not started”)

G0 is **design sufficiency for implementation**, not visual polish or live beta readiness. Ordinary microcopy and secondary dashboard ergonomics may remain iterative after G0.

---

## 1. Pass / fail vocabulary

| Result | Meaning |
| --- | --- |
| `Pass` | Criterion met; evidence linked |
| `Fail` | Criterion not met; gate cannot pass |
| `Pending` | Incomplete; treated as blocking if Mandatory |
| `Pending (external selection)` | Blocked on outside party (e.g., live partner); see synthetic path exception |
| `Waived` | Written waiver with owner, rationale, expiry |
| `N/A` | Not applicable with documented reason |

**Gate rule:** G0 **passes** only when every Mandatory criterion is `Pass` or `Waived`, except where this document explicitly allows the **synthetic skeleton path** to proceed while the live-partner criterion remains `Pending (external selection)`.

---

## 2. Synthetic path exception (skeleton only)

| Allowed while live partner is pending | Not allowed |
| --- | --- |
| Create production repo **after** other G0 bundles pass **or** under an explicit program decision that repo bootstrap may proceed with partner pending | Mark live partner criterion `Pass` using synthetic data |
| Implement **no-PII** tenant → publication → command/reconciliation skeleton using SYNTHETIC Albany fixtures | Live applicants, live PII, live ads |
| CI, ADRs, threat model drafts, UX specs against synthetic nexus | Counsel pack treating synthetic nexus as customer approval |
| Internal demos labeled `SYNTHETIC` | G3 / concierge beta |

**Synthetic partner reference:** North Atlantic Motors Group / Albany Service Center in [`docs/partners/ny-design-partner-dossier.md`](../partners/ny-design-partner-dossier.md) — clearly marked SYNTHETIC.

**Re-entry rule:** When a live partner is selected, re-open criteria P1–P6 and N1–N4; replace synthetic pack IDs; do not silently reuse Albany determinations.

---

## 3. Criterion bundles

### Bundle P — Partner, nexus, ATS, owners (Mandatory for live G0; partner item may stay pending)

| ID | Criterion | Pass evidence | Fail if | Status |
| --- | --- | --- | --- | --- |
| P1 | One NY dealer group + one rooftop selected | Dossier status `SELECTED` | No live selection; synthetic-only | **`Pending (external selection)`** |
| P2 | Readiness checklist Sections A–F all Pass/Waived | [`readiness-checklist.md`](../partners/readiness-checklist.md) sign-off | Any Mandatory Fail/Pending | **`Pending (external selection)`** |
| P3 | Exact NY state/local nexus resolved (incl. NYC yes/no) | Counsel memo + dossier §4.3 | Vague “New York” only | **`Pending (external selection)`** |
| P4 | First allowlisted policy pack scoped to that nexus | Pack version ID | Pack undefined | **`Pending (external selection)`** |
| P5 | ATS targets known: generic path + named connectors #1/#2 | [`ats-connector-selection.md`](../partners/ats-connector-selection.md) sign-off | Named connectors locked without demand **or** left unknown at live G0 claim | **`Pending (external selection)`** — generic strategy locked; #1/#2 unset |
| P6 | Accountable owners named (sponsor, reviewers, tech, concierge) | Dossier §3.2 / checklist F | Missing decision owner | **`Pending (external selection)`** |

**Bundle P roll-up:** `Pending (external selection)` — **blocks live G0 Pass**; **does not block** synthetic skeleton work under §2.

---

### Bundle U — UX / service design (Mandatory)

| ID | Criterion | Pass evidence | Fail if | Status |
| --- | --- | --- | --- | --- |
| U1 | Personas + capability matrix for applicant, HR owner, hiring manager, trained reviewer, dealer admin, concierge, recovery/compliance | Spec link | Missing actor | **`Pass`** — [`personas.md`](../ux/personas.md), [`capability-matrix.md`](../ux/capability-matrix.md) |
| U2 | Service blueprints for onboarding; listing/import/audit/approval/publication; application/receipt; correction/privacy/accommodation; human review→start; campaign CSV reconciliation; ATS recovery; operational recovery | Spec link | Missing critical journey | **`Pass`** — [`service-blueprints.md`](../ux/service-blueprints.md) (JB-01…08) |
| U3 | Role-filtered IA + complete P0 screen/form inventory | Inventory link | P0 gaps unknown | **`Pass`** — [`information-architecture.md`](../ux/information-architecture.md), [`screen-form-inventory.md`](../ux/screen-form-inventory.md) |
| U4 | Canonical field dictionary (type, requiredness, validation, provenance, editor/viewer/approver, purpose, sensitivity, retention, ATS mapping, analytics eligibility, prohibited uses) | Dictionary link | Ambiguous fields | **`Partial`** — [`field-dictionary.md`](../ux/field-dictionary.md); per-family module fields still thin |
| U5 | Schema-driven form model: stable core + role-specific requirement/compensation modules for every dealership role family | Spec link | One-off forms per role without model | **`Partial`** — model in field-dictionary/charter; role matrices incomplete |
| U6 | Domain/degraded states specified (loading, empty, blocked, stale, denied, expired, duplicate, accepted, resume pending/quarantined, replaying, reconciled, magic-link recovery, `NeedsReconciliation`) | State dictionary | Silent failure states | **`Pass`** — [`state-error-recovery.md`](../ux/state-error-recovery.md) |
| U7 | Low-fi prototypes for entire P0 journey; hi-fi only for critical applicant/approval/reviewer/recovery/analytics paths | Prototype links | Waterfall visual polish substituted for journey coverage | **`Partial`** — [`prototypes.md`](../ux/prototypes.md) ASCII low-fi; no clickable hi-fi |
| U8 | Full dealership-role inventory exists (deep acceptance evidence may continue post-G0 but must finish before beta) | Role inventory | Unknown role families | **`Partial`** — [`docs/roles/matrices/`](../roles/matrices/) + `src/modules/roles/catalog.ts`; most matrices stub |

**Bundle U roll-up:** **`Partial`** (Pass on U1–U3/U6; Partial U4/U5/U7/U8) — **not** `Not started`

---

### Bundle A — Architecture, vendors, assurance (Mandatory)

| ID | Criterion | Pass evidence | Fail if | Status |
| --- | --- | --- | --- | --- |
| A1 | Provider decisions: identity, PostgreSQL/DR, acceptance envelope, malware scanning, email, observability, labor data, AI routes, deployment topology | Decision log / ADRs | Critical vendor TBD with no owner | **`Partial`** — ADRs + [`provider-allowlists.md`](../provider-allowlists.md); most vendors still unselected |
| A2 | ADRs for tenant/purpose isolation, publication manifests, command/outbox, intake acceptance, policy packs, tracking, communications, analytics, AI shadow isolation, rollback, recovery | ADR index | Missing critical ADR | **`Partial`** — [`docs/adr/`](../adr/) 0001–0010 Accepted; no dedicated policy-pack ADR |
| A3 | Data inventory + purpose/field/audience/retention matrix | Matrix link | Purpose ambiguity | **`Pass`** (synthetic) — [`data-inventory.md`](../data-inventory.md), [`purpose-field-retention-matrix.md`](../purpose-field-retention-matrix.md) |
| A4 | Role-allocation matrix (dealer vs platform duties) | Matrix + counsel ack | Unassigned duty | **`Partial`** — [`role-allocation.md`](../role-allocation.md); counsel ack pending nexus |
| A5 | Trust-boundary threat model + abuse cases | Threat model link | Unreviewed critical threat | **`Partial`** — [`threat-model.md`](../threat-model.md); formal sign-off open |
| A6 | Invariant register | Register link | No invariants | **`Pass`** — [`invariant-register.md`](../invariant-register.md) |
| A7 | SLO/SLI definitions + recovery criteria | Ops draft | No recovery ownership | **`Pass`** (draft) — [`slos.md`](../slos.md), [`recovery-criteria.md`](../recovery-criteria.md) |
| A8 | Provider allowlists (incl. AI routes) | Allowlist doc | Open-ended model fallback | **`Partial`** — allowlist present; SELECTION STATUS largely unselected |
| A9 | Traceability matrix: invariant → actor/authority → journey → screen/form → record/state → notice/copy → event → test → recovery owner | Matrix link | Orphan critical flows | **`Partial`** — [`traceability-matrix.md`](../traceability-matrix.md) + [`ux/traceability.md`](../ux/traceability.md) |
| A10 | Counsel implementation packet for exact NY nexus (or explicit deferral while synthetic-only) | Packet **or** documented synthetic deferral | Claiming live nexus without packet | **`Pass (synthetic deferral)`** per §2/§6; live still **`Pending (external selection)`** — [`counsel-packet.md`](../counsel-packet.md) |

**Bundle A roll-up:** **`Partial`** / partner-linked items pending — **not** `Not started`

---

### Bundle C — Critical-flow ownership (Mandatory)

Every critical data flow must have authority, retention, failure, recovery, and test ownership.

| ID | Flow | Authority owner | Retention owner | Failure mode documented | Recovery owner | Test owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C1 | Listing → audit → approval → `PageRelease` | Dealer HR / hiring manager (approve); Platform eng (publish) | Platform eng | JB-02 / ADR 0005 / RC-06 | Platform eng | Platform eng (G1 publish tests) | **`Partial`** |
| C2 | Application acceptance envelope (+ resume pending/quarantine) | Platform eng (receipt); Dealer (notices) | Platform eng + counsel floors | ADR 0004 / RC-01–03 | Platform eng | Platform eng (envelope tests) | **`Partial`** |
| C3 | Human review → disposition → confirmed start | Dealer trained reviewer | Dealer + platform | JB-05 / role-allocation | Concierge + platform | Platform eng (UAT later) | **`Partial`** |
| C4 | ATS handoff + reconciliation | Dealer HR + platform | Platform eng | ATS selection / JB-07 | Platform eng + concierge | Platform eng | **`Partial`** |
| C5 | Campaign CSV import + attribution (descriptive) | Dealer admin + platform | Platform eng | JB-06 / ADR 0009 | Platform eng + concierge | Platform eng | **`Partial`** |
| C6 | Rights / correction / withdrawal lineage | Dealer + counsel + platform | Platform eng + counsel | JB-04 / purpose matrix / RC-12 | Platform eng + counsel | Platform eng (G2) | **`Partial`** |
| C7 | Emergency pause / kill switch | Platform eng (ops) | Platform eng | RC-15–16 / INV-51 | Platform eng (on-call) | Platform eng (`kill-switch` tests) | **`Partial`** |
| C8 | Backup restore / replay / ambiguous timeout | Platform eng | Platform eng | RC-08–11 / ADR 0010 | Platform eng | Platform eng | **`Partial`** |

**Bundle C roll-up:** **`Partial`** (owners named from recovery-criteria / role-allocation; drill evidence incomplete)

**Hard fails (any one fails G0):**

| ID | Condition | Status |
| --- | --- | --- |
| X1 | Unresolved **critical** threat | **`Clear (design)`** — mitigations in threat-model; formal assurance sign-off still open for live |
| X2 | False-success intake state possible in design | **`Clear (design)`** — INV-11–13 / ADR 0004 / envelope tests; live independent envelope still G2 |
| X3 | Ambiguous employer vs platform **decision** authority | **`Clear (design)`** — role-allocation + INV-18; counsel confirmation pending nexus |

---

## 4. Evidence index

| Artifact | Path / link | Version | Date |
| --- | --- | --- | --- |
| Partner process index | [`docs/partners/README.md`](../partners/README.md) | 2026-07-28 | 2026-07-28 |
| Readiness checklist | [`docs/partners/readiness-checklist.md`](../partners/readiness-checklist.md) | 2026-07-28 | 2026-07-28 |
| Partner dossier | [`docs/partners/ny-design-partner-dossier.md`](../partners/ny-design-partner-dossier.md) | SYNTHETIC + empty live | 2026-07-28 |
| Operating facts questionnaire | [`docs/partners/operating-facts-questionnaire.md`](../partners/operating-facts-questionnaire.md) | OFQ-2026-07-28 | 2026-07-28 |
| ATS connector selection | [`docs/partners/ats-connector-selection.md`](../partners/ats-connector-selection.md) | Strategy locked | 2026-07-28 |
| UX specs | [`docs/ux/`](../ux/) (Complete v0.1 package) | 2026-07-29 | 2026-07-29 |
| ADR index | [`docs/adr/README.md`](../adr/README.md) | 0001–0010 | 2026-07-29 |
| Threat model | [`docs/threat-model.md`](../threat-model.md) | G1 self-check Partial | 2026-07-29 |
| Counsel packet | [`docs/counsel-packet.md`](../counsel-packet.md) (live nexus pending; synthetic deferral via G0 §6) | scaffold | 2026-07-29 |
| Invariants / recovery / allowlists | [`invariant-register.md`](../invariant-register.md), [`recovery-criteria.md`](../recovery-criteria.md), [`provider-allowlists.md`](../provider-allowlists.md) | current | 2026-07-29 |

---

## 5. Decision outcomes

### 5.1 Full G0 Pass (live implementation-ready)

All of:

1. Bundles U, A, C are `Pass` (no Mandatory `Pending`/`Fail`).  
2. Hard fails X1–X3 are `Clear`.  
3. Bundle P is `Pass` (live partner selected, nexus resolved, ATS #1/#2 named, owners named).  

**Effect:** Production repository bootstrap and subsequent gates proceed toward live-PII qualification with a real policy pack.

### 5.2 Conditional proceed — synthetic skeleton only

All of:

1. Bundles U, A (except live counsel packet), and C meet the program’s agreed minimum for skeleton bootstrap **or** program owner records an explicit time-boxed decision to bootstrap repo while U/A complete in parallel—**without** weakening X1–X3.  
2. Bundle P remains `Pending (external selection)` and is **not** marked Pass.  
3. Engineering uses SYNTHETIC Albany fixtures only; no live PII.  
4. Live partner selection remains critical-path for policy pack, UAT, and G3.

**Effect:** Allows G1-oriented skeleton work; **does not** constitute full G0 Pass for live beta planning estimates.

### 5.3 Fail / hold

Any Mandatory `Fail`, unresolved X1–X3, or attempt to treat synthetic partner as live selection.

---

## 6. Sign-off

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Program owner | | | Pass / Conditional synthetic / Fail |
| UX owner | | | Pass / Fail / Abstain |
| Engineering owner | | | Pass / Fail / Abstain |
| Assurance / security | | | Pass / Fail / Abstain |
| Counsel | | | Pass / Defer (synthetic) / Fail |

### Current recorded decision (2026-07-28)

| Item | Decision |
| --- | --- | --- |
| Live partner (P1–P6) | **`Pending (external selection)`** |
| Synthetic skeleton path | **Allowed for engineering skeleton only** |
| Full G0 Pass | **Not granted** |
| Named ATS #1 / #2 | **Unselected** |
| Next action | Run partner pipeline per [`docs/partners/README.md`](../partners/README.md); complete Bundles U/A/C |

---

## 7. Exit checklist (printable)

- [ ] Bundle P live Pass **or** explicit Conditional synthetic proceed documented  
- [ ] Bundle U Pass  
- [ ] Bundle A Pass (live counsel packet or documented synthetic deferral)  
- [ ] Bundle C Pass  
- [ ] X1–X3 Clear  
- [ ] Evidence index populated  
- [ ] Sign-offs recorded  
- [ ] If Conditional: SYNTHETIC labeling verified; G0 live partner criterion still Pending  

---

## 8. Downstream gates (reference only)

| Gate | Intent |
| --- | --- |
| G1 | No-PII skeleton proven (clean clone, preview, synthetic E2E, isolation, idempotency, recovery) |
| G2 | Live-PII ready (security/privacy, rights, degraded intake, restore, a11y, counsel) |
| G3 | NY concierge beta ready (all-role acceptance, ATS connectors, UAT, metrics, no critical findings) |

Partner selection is required before G3 and for any live policy pack; do not skip from synthetic G1 to applicants.
