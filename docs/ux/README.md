# DealerHire beta UI/UX specification

Implementation-ready UX package for the **New York concierge beta**: one dealer group, one rooftop, English, managed platform subdomain, accountless applicants, trained human review, manual ads with CSV reconciliation, email-only communications, and tenant-local operational/descriptive analytics.

This folder is a product contract for screens, authority, copy, states, and acceptance—not visual polish alone. It must stay consistent with the architecture decision register and partner/gate docs. Do not redefine employer authority, intake receipt rules, or analytics claim language in prototypes or tickets.

## Document index

| # | Document | Purpose | Primary consumers |
| --- | --- | --- | --- |
| 1 | [charter.md](./charter.md) | Beta boundary, deferred features, non-negotiable UX invariants | Product, eng, counsel, partner |
| 2 | [personas.md](./personas.md) | Behavioral personas and counsel stakeholder | Design, UAT, training |
| 3 | [capability-matrix.md](./capability-matrix.md) | Action × tenant/rooftop/purpose/delegation permissions | Auth, eng, ops |
| 4 | [service-blueprints.md](./service-blueprints.md) | End-to-end journeys with front/backstage/support | Design, eng, ops |
| 5 | [information-architecture.md](./information-architecture.md) | Public, applicant, dealer, ops sitemaps (role-filtered) | Design, eng |
| 6 | [screen-form-inventory.md](./screen-form-inventory.md) | Complete P0 screen/form inventory | Eng, QA, design |
| 7 | [field-dictionary.md](./field-dictionary.md) | Canonical fields, metrics, provenance | Eng, ATS, analytics |
| 8 | [state-error-recovery.md](./state-error-recovery.md) | UI + domain states and recovery | Eng, ops, QA |
| 9 | [content-legal-deck.md](./content-legal-deck.md) | Versioned copy IDs and claim language | Counsel, content, eng |
| 10 | [design-system.md](./design-system.md) | Tokens, a11y, form patterns, badges | Design, eng |
| 11 | [analytics-dashboards.md](./analytics-dashboards.md) | Dashboard surfaces, freshness, claim class | Analytics, product |
| 12 | [prototypes.md](./prototypes.md) | Prototype scope + ASCII wireframes | Design, UAT |
| 13 | [acceptance-criteria.md](./acceptance-criteria.md) | G2/G5-style UX gates and defect bars | QA, product, partner |
| 14 | [traceability.md](./traceability.md) | Invariant → … → test matrix | Assurance, counsel |

Related folders:

| Folder | Relationship |
| --- | --- |
| [../partners/](../partners/) | Partner selection, nexus, ATS targets |
| [../gates/](../gates/) | G0–G3 program gates (when present) |

## How to use this package

1. **Before coding a journey** — confirm charter invariants, persona, blueprint, and capability row.
2. **Before shipping a screen** — complete inventory row, field dictionary bindings, state/recovery paths, copy IDs, analytics events, and acceptance tests.
3. **Before partner UAT** — walk blueprints with the matching persona; reject flows that require deferred features.
4. **Before live PII (G2)** — rights, degraded intake, WCAG, and legal copy must pass [acceptance-criteria.md](./acceptance-criteria.md).
5. **Before beta open (G3)** — all-role listing modules, review→start, CSV reconciliation, and dashboard claim labels must pass.

## Beta experience envelope (summary)

| Dimension | In beta | Deferred |
| --- | --- | --- |
| Market | One NY rooftop; single-state, non-remote jobs | Multi-rooftop, multi-state, remote |
| Locale / host | English; managed platform subdomain | Spanish parity; dealer custom domains |
| Applicant | Accountless; magic-link + step-up | Candidate accounts / marketplace |
| Review | Human evidence matrix; candidate AI invisible | Live `EmploymentAIUse` |
| Ads | Manual Meta/Google + CSV import | Live API actuation; autonomous spend |
| Comms | Transactional email | SMS; marketing push |
| Analytics | Tenant-local operational/descriptive | Cross-tenant benchmarks; causal claims |

## Ownership

| Concern | Owner |
| --- | --- |
| UX package integrity | Product / design lead |
| Capability / purpose enforcement | Engineering (auth + policy) |
| Legal copy IDs and notices | Counsel + content |
| Metric definitions and freshness labels | Analytics + product |
| Recovery UI/CLI parity | Platform ops |
| Partner UAT sign-off | Dealer HR sponsor + trained reviewers |

## Change control

- Material changes to invariants, permissions, receipt semantics, metric definitions, or legal copy require a dated revision note in the affected file and an update to [traceability.md](./traceability.md).
- Prototypes may explore layout; they may not invent new authority, claim class, or data uses.
- Counsel-owned copy IDs in [content-legal-deck.md](./content-legal-deck.md) are authoritative over UI strings in code until a new version is approved.

## Status

| Item | Status |
| --- | --- |
| UX package authored | **Complete (v0.1)** — 2026-07-28 |
| Partner validation of journeys | Pending partner selection |
| High-fi visual system | Iterative after low-fi acceptance |
| Counsel-approved final notice text | Pending counsel packet for exact nexus |
