# UX charter — New York concierge beta

**Version:** 0.1 · **Date:** 2026-07-28  
**Scope:** UI/UX product boundary for the first live DealerHire release.

## 1. Purpose

Define what the beta experience **must**, **may**, and **must not** include so design, engineering, ops, and partner UAT share one boundary. Anything outside this charter is out of scope for P0 screens and acceptance tests.

## 2. Beta envelope (in scope)

| Dimension | Rule |
| --- | --- |
| Customer | Exactly **one** New York dealer group and **one** rooftop |
| Jobs | Single-state NY, non-remote; every dealership role family deeply validated before live traffic |
| Host | Managed platform subdomain (dealer-branded pages allowed under that host) |
| Locale | **English only** |
| Applicant identity | **Accountless** where practical; public application ID + rotatable magic-link; step-up for sensitive actions |
| Candidate evaluation | **Trained human review** via requirement-by-requirement evidence matrix |
| Candidate AI | **Shadow-only** — invisible to applicants, reviewers, campaigns, communications, and beta analytics |
| Ads | Dealer- or delegated-operator **manual** Meta/Google launch/change; **CSV import** for spend/delivery read-backs |
| ATS | Canonical adapter + CSV/signed webhook + up to two partner-selected named connectors |
| Communications | **Transactional email only** |
| Analytics | **Tenant-local**, role-scoped, **operational or descriptive**; mixed freshness; reconciled before business use |
| Support | Defined **business hours** + always-available intake/campaign kill switches |
| Accessibility | **WCAG 2.2 AA** on all P0 surfaces |

## 3. Explicitly deferred (not in beta UI)

Do not design, stub as clickable, or accept as “coming soon” primary paths for:

- Full ATS replacement
- Candidate marketplace or persistent candidate accounts
- Live Meta/Google API actuation; autonomous launches or spend increases
- Dealer custom domains (Cloudflare for SaaS)
- Spanish / multi-locale parity
- SMS / registered messaging
- Generative video/image creative pipelines
- Applicant retargeting, customer-list audiences, person-level conversion uploads
- Background, MVR, social, reputation, or reference enrichment (FCRA boundary)
- Cross-client candidate profiles or shared candidate identifiers
- Reviewer-visible candidate AI / composite scores / auto-reject
- Stateful autonomous agents / MCP copilot as production dependency
- Cross-tenant first-party benchmarks or industry intelligence
- Causal / effect-bearing optimization dashboards (“lift”, “caused”)
- Y90 as a launch gate or candidate-level feature (optional manual capture only, future aggregate use)
- Prior-compensation collection in the application or hiring path
- SSO/SCIM self-service onboarding at scale (concierge onboarding is in scope)
- Bulk multi-rooftop operations

Secondary marketing surfaces (blog, pricing site) are out of this package.

## 4. Non-negotiable UX invariants

These may not be “softened” by design convenience.

### I-01 — Employer authority

Dealer HR / authorized hiring owner approves requirements, compensation facts, qualification rubrics, and publication. Platform operators and concierge staff **cannot** substitute that approval. UI must show who approved what, when, and on which version.

### I-02 — Default-deny capability

Every consequential action checks signed **actor + tenant + rooftop + purpose + delegation + capability**. Missing context fails closed. Cross-tenant or elevated work requires explicit, expiring delegation with real actor and `on_behalf_of` visible in audit UI.

### I-03 — Receipt = acceptance envelope

An application receipt is shown only after `ApplicationAcceptanceEnvelope` conditional insert succeeds. R2 upload, queue publish, Turnstile success, or PostgreSQL projection alone never constitutes acceptance.

### I-04 — Degraded resume, durable application

If object storage or malware scanning is unavailable, accept structured application, issue receipt, mark resume `PendingUpload` or `Quarantined`. Never discard the application or show a false “failed to apply” after envelope success.

### I-05 — Atomic notices and authority

Notices, choices, jurisdiction snapshot, and job/control release hash travel with the envelope. No blanket “full release” checkbox. Optional permissions are never conditions of applying.

### I-06 — Human review without AI influence

Reviewer UI shows primary evidence only. No composite score, hidden ranking, auto-reject, or shadow-AI signals. Absence = unknown. Adverse facts require primary-evidence verification.

### I-07 — Protected demographics segregation

Voluntary compliance demographics (if collected) live in a segregated vault, are inaccessible to decision-makers and models, and never appear on review, disposition, campaign, or hiring-manager surfaces.

### I-08 — Pay transparency on every published role

Every published listing requires approved **minimum and maximum** base-pay or rate range **plus** applicable compensation structure (flat-rate, guarantee, draw, commission, bonus, OT, benefits as applicable). AI never invents pay.

### I-09 — Effect-manifest approval

Any approval that authorizes an effect shows a server-generated effect manifest and human-visible diff. Semantic change after approval requires reapproval. Ambiguous outcomes enter `NeedsReconciliation` — never silent retry-as-create.

### I-10 — Publication via PageRelease

Public pages become visible only through one `PageRelease` manifest pointer to content-addressed artifacts. Rollback switches the pointer. Auth UI must expose current release, previous known-good, and tombstone/expiry states.

### I-11 — Analytics claim class

Beta dashboards may label outputs **operational** or **descriptive** only. Attribution language is **associated with** / **allocated to** — never lift, caused, or effect — without a registered `AnalysisContract` (out of beta).

### I-12 — Metric definitions

- **Qualified hire** = dealer confirms exact versioned qualification rubric **and** candidate confirmed start.
- **Clock** = `JobControlVersion` approval → confirmed start.
- **Cost** = attributable ad spend + explicitly allocated campaign-service cost.
- Outcomes are **report-only** in beta; they do not feed campaign advice or candidate processing.

### I-13 — Freshness honesty

Sources show `Fresh` / `ObservedZero` / `Missing` / `Stale`. Stale analytical evidence → abstain (no new advice). Stale safety-critical state → halt/pause. Mixed freshness is labeled on every dashboard tile.

### I-14 — No third-party tracking on sensitive surfaces

Application, rights, and accommodation pages: no third-party scripts. Server-side allowlisted events only; honor GPC; strip application tokens and unnecessary referrers.

### I-15 — Equivalent non-AI path

Manual review path provides the same timing, visibility, correction, review standard, and outcome as any future AI-assisted path. Beta ships only the manual path as authoritative.

### I-16 — Accessibility and mobile-first applicant

P0 applicant flows are mobile-first and WCAG 2.2 AA. Accommodation route is first-class, not buried.

### I-17 — Audited recovery, no DB editing

Operator recovery UI/CLI covers inspect, read-back, DLQ/outbox replay, reconciliation, safe retry. Recovery never requires direct database edits or invisible spreadsheets.

### I-18 — Fail closed on missing legal facts

Missing employee-count, federal-contractor, government/union, OEM/franchise, recordkeeping, or nexus facts block publication, campaigns, AI use, tracking, communication, export, and decision support — with clear blocked UI, not silent omission.

## 5. Experience principles (within invariants)

1. **One job per screen section** — especially on mobile apply and approval manifests.
2. **Receipt over hope** — applicants always leave with a durable ID and next step.
3. **Version visibility** — listings, notices, rubrics, and releases show version/as-of.
4. **Explain denial** — capability denial, policy block, and stale halt states say what failed and who can fix it.
5. **Native HTML first** — prefer accessible native controls; progressive enhancement over SPA chrome.
6. **Concierge honesty** — when an operator acts on behalf of a dealer, the UI shows delegation, never impersonation without audit.

## 6. Success definition (UX)

| Measure | Target |
| --- | --- |
| Unassisted P0 applicant completion | ≥ 90% of representative testers complete apply → receipt without staff help |
| Critical defects at G2/G3 | Zero open critical security, privacy, accessibility, or false-receipt defects |
| WCAG 2.2 AA | No outstanding Level A/AA blockers on P0 routes |
| Reviewer training | Trained reviewers complete evidence-matrix review without platform composite scores |
| Partner UAT | HR sponsor + reviewers sign blueprints for listing→publish and review→start |

## 7. Out-of-charter escalation

If a partner or prototype requests a deferred capability, record it as a post-beta gate item. Do not expand P0 inventory without updating this charter, [capability-matrix.md](./capability-matrix.md), and [traceability.md](./traceability.md).
