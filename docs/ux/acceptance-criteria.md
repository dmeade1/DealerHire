# UX acceptance criteria — gates

**Version:** 0.1 · **Date:** 2026-07-28  
UX-specific gates aligned to the engineering readiness sequence. Program gates G0–G3 remain authoritative in `docs/gates/` when published; this file defines **UX evidence** those gates consume.

Naming note: partner docs refer to **G2** as live-PII readiness. This package also defines **G5-UX** as the usability/accessibility quality bar used inside G2/G3 (not a separate program phase).

---

## 1. Gate map

| Gate | Program meaning | UX package must show |
| --- | --- | --- |
| **G0** | Implementation-ready | Journeys, IA, inventory, fields, states, authority, critical low-fi accepted |
| **G1** | Synthetic no-PII skeleton | UI can render synthetic listing→publish→command/recon without live PII |
| **G2** | Live PII allowed | Rights, degraded intake, WCAG, legal copy wiring, zero critical UX defects |
| **G3** | Beta open | All-role modules, review→start, CSV analytics, partner UAT, no critical defects |
| **G5-UX** | Quality bar (embedded) | ≥90% unassisted apply completion; WCAG 2.2 AA; no critical defects |

---

## 2. G0 — UX implementation-ready checklist

| # | Criterion | Evidence | Status |
| --- | --- | --- | --- |
| G0-UX-01 | Charter invariants agreed | [charter.md](./charter.md) signed by product | Pending |
| G0-UX-02 | Personas + UAT casting | [personas.md](./personas.md) | Pending partner |
| G0-UX-03 | Capability matrix reviewed by eng | [capability-matrix.md](./capability-matrix.md) | Pending |
| G0-UX-04 | All JB-01…08 blueprints accepted | [service-blueprints.md](./service-blueprints.md) | Pending |
| G0-UX-05 | Role-filtered IA complete | [information-architecture.md](./information-architecture.md) | Pending |
| G0-UX-06 | P0 inventory complete (55 screens) | [screen-form-inventory.md](./screen-form-inventory.md) | Pending |
| G0-UX-07 | Field dictionary covers listing/comp/app/metrics | [field-dictionary.md](./field-dictionary.md) | Pending |
| G0-UX-08 | State/recovery includes envelope, resume, liveness, NeedsReconciliation | [state-error-recovery.md](./state-error-recovery.md) | Pending |
| G0-UX-09 | Critical low-fi W-01…W-05 accepted | [prototypes.md](./prototypes.md) | Pending |
| G0-UX-10 | Traceability matrix populated | [traceability.md](./traceability.md) | Pending |

**Fail if:** any P0 journey missing, HR approval delegable to concierge by default, or receipt≠envelope.

---

## 3. G2 — Live-PII UX gate

Must pass before real applicant PII in non-synthetic environments.

| # | Criterion | Test IDs | Pass rule |
| --- | --- | --- | --- |
| G2-UX-01 | Receipt only after envelope accept | AT-APP-02 | Fake success impossible when insert fails |
| G2-UX-02 | PendingUpload/Quarantined still receipt | AT-APP-03, AT-APP-04 | Structured accept preserved |
| G2-UX-03 | Notice hashes atomic with envelope | AT-COPY-01, AT-SS-06 | Manifest mismatch fails closed |
| G2-UX-04 | Magic-link + step-up on correct/privacy | AT-SS-01…04 | Anti-enumeration |
| G2-UX-05 | Accommodation path usable | AT-SS-05, AT-A11Y-01 | Keyboard + SR smoke |
| G2-UX-06 | No third-party scripts on sensitive pages | AT-TRACK-01 | CSP/network assert |
| G2-UX-07 | Zero PII in client analytics/logs samples | AT-PRIV-01 | Review evidence |
| G2-UX-08 | Protected demos inaccessible to decision UIs | AT-AN-VAULT-01, AT-REV-02 | |
| G2-UX-09 | Candidate AI invisible | AT-AN-AI-01, AT-REV-02 | |
| G2-UX-10 | WCAG 2.2 AA on P0 applicant + rights | AT-A11Y-02 | No A/AA blockers |
| G2-UX-11 | Counsel-approved copy IDs wired (nexus pack) | content deck registry | No placeholder on live |
| G2-UX-12 | **G5-UX** usability sample on apply | §5 | ≥90% unassisted |
| G2-UX-13 | No open **critical** UX defects | defect bar §6 | Zero |

---

## 4. G3 — Beta-open UX gate

| # | Criterion | Pass rule |
| --- | --- | --- |
| G3-UX-01 | All dealership role-family modules usable in editor | Partner + internal matrices |
| G3-UX-02 | JB-02 listing→publish UAT signed by P-HR | Written sign-off |
| G3-UX-03 | JB-05 review→start UAT signed by P-REV + P-HR | Written sign-off |
| G3-UX-04 | Effect manifest matches published page | AT-DLR-10/11 |
| G3-UX-05 | CSV reconcile + freshness badges correct | AT-CMP-01/02, AT-AN-FRESH-01 |
| G3-UX-06 | Funnel + QH metrics match dictionary | AT-AN-QH-01 |
| G3-UX-07 | Analytics claim language clean | AT-AN-CLAIM-01 |
| G3-UX-08 | ATS failure shows NeedsReconciliation / replay | AT-ATS-02 |
| G3-UX-09 | Ops recovery without DB edit | AT-OPS-02/03 |
| G3-UX-10 | Kill switch maintenance copy | AT-OPS-05 |
| G3-UX-11 | WCAG 2.2 AA on dealer P0 + public | AT-A11Y-03 |
| G3-UX-12 | No critical defects; high bugs waived with owner | §6 |
| G3-UX-13 | Support business-hours messaging accurate | SCR-SUP-01 |

---

## 5. G5-UX — Usability & quality bar

### 5.1 Unassisted completion

| Measure | Method | Target |
| --- | --- | --- |
| Apply → receipt | ≥10 representative mobile sessions (or ≥5 if partner-constrained, documented) | **≥90%** complete without staff help |
| Critical errors | False failure after accept; lost receipt; pay missing | **0** |
| Time | Qualitative; flag if median > 15 min for standard role | Investigate |

Tasks scripted from JB-03; facilitators may only give charter-safe prompts.

### 5.2 WCAG 2.2 AA

| Surface | Target |
| --- | --- |
| Public job, apply, receipt, rights, accommodation | Zero outstanding A/AA blockers |
| Evidence matrix, approvals, ops recovery | Zero outstanding A/AA blockers on P0 |
| Automated | axe (or equiv.) clean on P0 routes |
| Manual | Keyboard + one screen-reader pass per surface class |

### 5.3 Authority / trust tasks (must succeed)

| Task | Actor | Pass |
| --- | --- | --- |
| Concierge cannot approve publication | P-CON | Denied with code |
| Reviewer never sees AI score | P-REV | Absent in UI/network |
| HM never sees vault demos | P-HM | Absent |
| Stale campaign not labeled Fresh business-ready | P-ADM | Badge correct |

---

## 6. Defect severity bar

| Severity | Definition | Ship rule |
| --- | --- | --- |
| **Critical** | False receipt/failure; authZ bypass; PII leak; vault visible to decision-maker; AI visible in decisions; WCAG blocker on apply; data loss; unrecoverable NeedsReconciliation with silent success | **Block G2/G3** |
| **High** | Major journey dead-end; pay omitted when live; missing freshness on cost tiles; keyboard trap | **Block G3** unless documented waiver + owner + date |
| **Medium** | Confusing copy; secondary nav bugs | Track; no block if workaround |
| **Low** | Polish | Iterative |

---

## 7. Test ID index (UX-owned)

| ID | Description |
| --- | --- |
| AT-PUB-01…02 | Public index/detail |
| AT-APP-01…05 | Apply, envelope receipt, resume retry, email |
| AT-SS-01…06 | Magic-link, status, correct, privacy, accom, notices |
| AT-DLR-01…11 | Dealer listing→release |
| AT-REV-01…04 | Queue, matrix, milestones, cases |
| AT-CMP-01…02 | Campaigns + CSV |
| AT-ATS-01…02 | ATS settings + deliveries |
| AT-AN-01…05 + ISO/CLAIM/QH/FRESH/RECON/VAULT/AI | Analytics |
| AT-SET-01…05 | Settings |
| AT-OPS-01…08 | Ops |
| AT-A11Y-01…03 | Accessibility |
| AT-COPY-01…02 | Legal pages |
| AT-TRACK-01 | No third-party on sensitive |
| AT-PRIV-01 | No PII in logs/analytics |

Exact automation lives beside modules; IDs must remain stable in CI reports.

---

## 8. Sign-off template

```text
Gate: G0-UX / G2-UX / G3-UX / G5-UX
Date:
Product:
Engineering:
Design:
Partner HR (if required):
Counsel (copy, if required):
Critical defects open: 0
Notes:
Result: PASS | FAIL
```

---

## 9. Relationship to deferred features

Acceptance tests must **fail** if a deferred capability is required to complete a P0 journey (e.g., SMS OTP, custom domain, AI ranking). Workarounds using deferred features are not valid passes.
