# Design-partner process

DealerHire’s first live release is a **New York concierge beta** for one dealer group and one rooftop. Partner selection is the critical-path blocker for Gate G0 (implementation-ready) and for the first allowlisted jurisdiction policy pack.

This folder is the operating process for selecting, qualifying, and documenting that partner. It does **not** authorize live PII, applicant traffic, or production repository work by itself—those require later gates (G1–G3).

## Current status

| Item | Status |
| --- | --- |
| Live design partner | **Not selected** |
| Exact NY state/local nexus | **Unresolved** (depends on live partner) |
| Named ATS connectors #1 and #2 | **Unselected** (partner demand + access) |
| Synthetic partner (engineering only) | Documented in [ny-design-partner-dossier.md](./ny-design-partner-dossier.md) |
| Specialist counsel | Retained (per architecture decision register) |
| Meta / Google API approval | Non-blocking for beta; pursue in parallel |

## Documents in this folder

| Document | Purpose | When to use |
| --- | --- | --- |
| [readiness-checklist.md](./readiness-checklist.md) | Mandatory qualification checklist with status fields | Qualify candidates; block G0 partner item until all mandatory rows pass |
| [ny-design-partner-dossier.md](./ny-design-partner-dossier.md) | Single source of truth for the selected (or synthetic) partner | Fill for every candidate; promote one dossier to “selected” |
| [operating-facts-questionnaire.md](./operating-facts-questionnaire.md) | Structured intake of legal/operating facts | Send to sponsor / HR / counsel contact; attach completed answers to dossier |
| [ats-connector-selection.md](./ats-connector-selection.md) | Canonical adapter strategy + named-connector selection | After ATS export/API access is confirmed; lock only with partner demand |

Related gate:

| Document | Purpose |
| --- | --- |
| [../gates/G0-implementation-ready.md](../gates/G0-implementation-ready.md) | Full G0 pass/fail criteria; partner row may remain pending while synthetic skeleton proceeds |

## Process overview

```text
Identify NY rooftop candidates
        │
        ▼
Send operating-facts questionnaire
        │
        ▼
Complete readiness checklist (mandatory rows)
        │
        ▼
Resolve exact nexus (NYC / non-NYC / local packs)
        │
        ▼
Confirm ATS access + shortlist → select connectors #1/#2
        │
        ▼
Promote dossier to SELECTED
        │
        ▼
Counsel packet for that nexus → unlock G0 partner criterion
```

### Step 1 — Screen candidates

Require a **New York State** rooftop. Prefer non-remote, single-state jobs only (beta excludes remote and multi-state roles). Capture group name, rooftop name, city/county, and OEM/franchise footprint.

### Step 2 — Collect operating facts

Use [operating-facts-questionnaire.md](./operating-facts-questionnaire.md). Incomplete employee-count, federal-contractor, government/union, OEM/franchise, recordkeeping, or nexus facts **fail closed** for publication, campaigns, AI, tracking, communications, export, and decision support.

### Step 3 — Run readiness checklist

Every mandatory item in [readiness-checklist.md](./readiness-checklist.md) must be `Pass` or `Waived (documented)` before the partner criterion for G0 can pass. `Pending` or `Fail` blocks live-partner G0 sign-off.

### Step 4 — Resolve nexus

Follow the exact resolution process in [ny-design-partner-dossier.md](./ny-design-partner-dossier.md#nexus-resolution-process). Do not enable a policy pack on “New York” alone—resolve state **and** local (including NYC applicability) with counsel.

### Step 5 — Select ATS connectors

Ship always: **canonical adapter + CSV / signed webhook**. Name connectors #1 and #2 only after partner demand and technical access are confirmed ([ats-connector-selection.md](./ats-connector-selection.md)).

### Step 6 — Promote dossier and feed G0

Mark one dossier `SELECTED`. Update G0 partner item from `Pending (external selection)` to `Pass` only when checklist + nexus + ATS targets + accountable owners are complete.

## Roles and accountability

| Role | Responsibility |
| --- | --- |
| Founder / program owner | Candidate pipeline, dossier ownership, G0 partner sign-off |
| Partner executive / HR sponsor | Authority for facts, access, weekly UAT, approvals |
| Trained reviewers (partner) | Human qualification / disposition under dealer authority |
| Partner technical contact | ATS export/API, mapping validation, webhook credentials |
| Concierge operator (DealerHire) | Weekly UAT facilitation, CSV campaign ops, recovery |
| Retained counsel | Nexus pack, notices, role allocation, contracts |

## Synthetic vs live partner

| Path | Allowed for | Not allowed for |
| --- | --- | --- |
| **Synthetic** (North Atlantic Motors Group / Albany Service Center) | No-PII walking skeleton, fixtures, CI demos, G1 engineering evidence | Live applicants, live ads, counsel pack as if real, G0 partner `Pass`, G3 beta |
| **Live selected partner** | G0 partner criterion, policy pack, UAT, G2/G3 live paths | — |

Synthetic data must be labeled `SYNTHETIC` in every artifact that could be mistaken for a customer record.

## Definition of done (partner selection)

Partner selection is complete when all of the following are true:

1. One NY dealer group + one rooftop named in a dossier with status `SELECTED`.
2. Readiness checklist has no mandatory `Fail` or unresolved `Pending`.
3. Exact nexus (state + local, NYC yes/no) documented and counsel-acknowledged.
4. Accountable owners named: executive/HR sponsor, trained reviewers, technical contact, DealerHire concierge owner.
5. ATS path confirmed: generic CSV/signed webhook plus two named connectors with access evidence.
6. Meta/Google account history/access recorded (API approval may remain in progress).
7. Completed questionnaire attached or linked from the dossier.
8. G0 partner criterion updated accordingly.

## Anti-patterns

- Treating “somewhere in New York” as a resolved nexus.
- Locking named ATS connectors before partner demand and sandbox/export access exist.
- Using the synthetic Albany profile as if it were a customer commitment.
- Proceeding to live PII because the skeleton uses synthetic partner fixtures.
- Waiving employee-count, federal-contractor, or recordkeeping facts without counsel-written exception.

## Change control

- Partner dossier and checklist are versioned in git.
- Status changes (`Candidate` → `Selected` → `Active beta` / `Withdrawn`) require a dated note in the dossier changelog.
- Jurisdiction or ATS changes after G0 reopen the affected G0 criteria and any dependent policy-pack / connector ADRs.
