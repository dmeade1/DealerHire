# ATS connector selection

**Status:** Strategy locked; named connectors **#1 and #2 unset** pending live partner demand and access.  
**Last updated:** 2026-07-28  
**Related:** [readiness-checklist.md](./readiness-checklist.md) (B2–B6), architecture ATS/comms decision register.

---

## 1. Strategy (locked)

DealerHire ships ATS integration as a **layered handoff**, not as a full ATS replacement.

| Layer | Commitment | Timing |
| --- | --- | --- |
| **Canonical adapter** | Stable internal port: normalize candidate/application/hire events, mapping, delivery attempts, reconciliation cases | Always — Phase 1+ |
| **Generic transport** | **CSV export/import** and **signed webhook** delivery with idempotency, retries, and reconciliation | Always — first live handoff |
| **Named connector #1** | Partner-selected vendor-specific adapter | After partner demand + access; required before G3 |
| **Named connector #2** | Second partner-selected vendor-specific adapter | Same as #1 |

### Non-goals (beta)

- Replacing the dealer’s ATS of record
- Bidirectional sync of the entire employee lifecycle
- Building a large connector catalog “just in case”
- Locking vendor #1/#2 before a live partner confirms demand and technical access

### Design rules

1. **All paths implement the canonical adapter contract** (see §3). Named connectors are thin translations.
2. **Generic CSV / signed webhook is production-grade**, not a temporary hack—audited, versioned, reconciliable.
3. **Partner demand selects the first two named connectors.** Engineering may recommend a shortlist; partner + access decide.
4. **Fail closed on ambiguous delivery.** Timeouts and unknown provider states create `NeedsReconciliation`, never silent success.
5. **No raw PII in logs.** Delivery telemetry stores IDs, hashes, status, timing, and policy versions only.

---

## 2. Canonical adapter contract (summary)

Named connectors and the generic path must support at least:

| Capability | Requirement |
| --- | --- |
| Application handoff | Push accepted application + structured fields + resume reference (or pending/quarantined marker) |
| Identity correlation | Stable DealerHire application ID ↔ ATS requisition/candidate IDs when available |
| Mapping | Versioned field map with required/optional/prohibited fields |
| Auth | Least-privilege credentials; secret storage per platform standards |
| Idempotency | Idempotency keys on outbound delivery; dedupe on inbound webhooks |
| Receipts | Provider receipt or durable export acknowledgment |
| Reconciliation | `DeliveryAttempt`, mismatch detection, replay, manual resolve |
| Lifecycle hooks (minimum) | Application received; optional disposition/hire/start observation if ATS exposes them |
| Error classes | Auth, mapping, validation, provider 4xx/5xx, timeout/unknown |
| Testability | Sandbox or fixture suite; contract tests in CI |

Inbound ATS webhooks (if used) must be **signed**, timestamp-validated, and tenant-scoped.

---

## 3. Generic path first (CSV + signed webhook)

### 3.1 CSV

| Topic | Decision |
| --- | --- |
| Direction (beta) | DealerHire → ATS operator import **and/or** scheduled drop; ATS → DealerHire for outcome CSV when API unavailable |
| Format | Versioned schema (`ats_handoff_csv_vN`) documented with the field dictionary |
| Transport | Secure exchange (signed URL, SFTP, or operator-mediated) with audit |
| Cadence | Near-real-time preferred; batch acceptable with SLA + stale detection |
| Reconciliation | Row-level status file or operator checklist tied to `DeliveryAttempt` |

### 3.2 Signed webhook

| Topic | Decision |
| --- | --- |
| Direction | DealerHire → partner/ATS middleware endpoint; optional ATS → DealerHire for status |
| Security | HMAC (or equivalent) signature, replay window, mTLS optional later |
| Payload | Canonical JSON schema versioned independently of vendor |
| Retries | Exponential backoff + DLQ; never drop without reconciliation case |
| Ambiguity | HTTP timeout without receipt → `NeedsReconciliation` |

**Exit criterion for “generic path ready”:** contract tests + one synthetic end-to-end delivery + one partner UAT dry run (live partner) or internal dry run (skeleton).

---

## 4. Evaluation criteria for named connectors

Score each candidate **0–2** (0 = missing, 1 = partial, 2 = strong). A connector should not be selected below a documented threshold without program waiver.

| ID | Criterion | Weight | What “2” looks like |
| --- | --- | --- | --- |
| C1 | **Partner demand** | Critical | Sponsor/TA states this ATS is system of record or must integrate |
| C2 | **Technical access** | Critical | Sandbox, API keys, or export automation available within diligence window |
| C3 | **API / export maturity** | High | Documented candidate/application APIs or reliable structured export |
| C4 | **Auth model fitness** | High | OAuth2/service account patterns compatible with secret handling |
| C5 | **Mapping coverage** | High | Can carry required application + job + disposition fields |
| C6 | **Webhook / event support** | Medium | Signed inbound events or polling with clear cursors |
| C7 | **Automotive / multi-rooftop fit** | Medium | Used by dealer groups; rooftop/location concepts mappable |
| C8 | **Idempotency & rate limits** | Medium | Documented limits; safe retry semantics |
| C9 | **Support responsiveness** | Medium | Partner or vendor can answer integration questions in UAT |
| C10 | **Compliance posture** | High | DPA / subprocessors acceptable to counsel; no forbidden enrichment |
| C11 | **Engineering cost** | Medium | Estimable adapter effort; no unbounded reverse engineering |
| C12 | **Reconciliation observability** | High | Can prove delivered vs failed vs unknown |

### Selection rule

1. Shortlist from §5 using partner’s current ATS + demand.  
2. Score with the matrix; attach scores to this doc.  
3. Choose **exactly two** named connectors for beta.  
4. Record ADR + mapping version IDs.  
5. Prove reconciliation on both before G3.

---

## 5. Evaluation shortlist (not locked)

Common automotive / dealer-adjacent ATS and recruiting systems to evaluate **with the live partner**. Presence here is **not** a build commitment.

| Vendor / product | Why on shortlist | Typical access pattern | Notes for DealerHire |
| --- | --- | --- | --- |
| **Hireology** | Widely used by dealership groups | API and/or export; partner admin access | Strong first ask if partner already lives there |
| **CDK** (HR/recruiting modules in CDK ecosystem) | Deep OEM/dealer footprint | Often export- or SI-mediated | Confirm exact product SKU; “CDK” alone is ambiguous |
| **Tekion** | Modern dealer platform adoption | Platform APIs / partner program | Validate hiring module scope vs DMS-only |
| **Reynolds and Reynolds** | Large installed base | Frequently export/SI | Budget integration friction |
| **DealerSocket / Fortellis** ecosystem tools | Dealer ops adjacency | Varies by product | Confirm ATS-of-record vs CRM |
| **iCIMS** | Enterprise TA suites at larger groups | Mature APIs | More common if group is multi-vertical |
| **Greenhouse** | Common at sophisticated TA orgs | Strong API + webhooks | Less auto-specific; fine if partner uses it |
| **Lever** | Same as Greenhouse | API + webhooks | Same |
| **Workday Recruiting** | Large groups / corporate | Complex API + governance | High cost; only if truly SoR |
| **UKG / Kronos** recruiting modules | Workforce suites | Varies | Confirm recruiting vs HCM boundary |
| **Bullhorn** | If group has adjacent staffing | API ecosystem | Usually not rooftop SoR |
| **Generic CSV / middleware** (Boomi, Workato, custom) | Fallback when ATS API is weak | Partner-owned middleware + our signed webhook | Counts as generic path hardening, not a “named ATS” |

**Recommendation:** Start diligence interviews with **Hireology, CDK (named HR/recruiting product), and Tekion** when the partner is a typical US franchise group—then replace the shortlist immediately if their SoR is elsewhere.

---

## 6. Placeholder slots — connector #1 and #2

### Connector #1

| Field | Value |
| --- | --- |
| Status | **`UNSELECTED — awaiting partner demand`** |
| Vendor / product | |
| Partner demand evidence | |
| Access evidence (sandbox/export) | |
| Scorecard link / summary | |
| Canonical mapping version | |
| Owner (eng) | |
| Target gate | Required before G3 |
| Risks | |

### Connector #2

| Field | Value |
| --- | --- |
| Status | **`UNSELECTED — awaiting partner demand`** |
| Vendor / product | |
| Partner demand evidence | |
| Access evidence (sandbox/export) | |
| Scorecard link / summary | |
| Canonical mapping version | |
| Owner (eng) | |
| Target gate | Required before G3 |
| Risks | |

### Synthetic skeleton stance

Until a live partner is selected, engineering should:

1. Implement **canonical adapter + CSV + signed webhook** against synthetic fixtures (`namg` tenant).  
2. Keep named connector packages as **empty slots** or interface stubs.  
3. Avoid hard-coding Hireology/CDK/Tekion as production dependencies.

---

## 7. Decision log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-07-28 | Canonical adapter + CSV/signed webhook first | Architecture register; works before vendor lock-in |
| 2026-07-28 | Exactly two named connectors, partner-selected | Deep validation over catalog breadth |
| 2026-07-28 | Shortlist published without lock | Enable evaluation; prevent premature build |

---

## 8. Sign-off (when selecting)

| Role | Name | Date | Connector #1 | Connector #2 |
| --- | --- | --- | --- | --- |
| Partner sponsor | | | Approve | Approve |
| Partner tech contact | | | Approve | Approve |
| DealerHire eng owner | | | Approve | Approve |
| Program owner | | | Approve | Approve |

**Current decision:** No named connectors selected.
