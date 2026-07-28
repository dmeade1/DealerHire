# Counsel packet

Checklist for retained employment, privacy, and advertising counsel. This packet scopes what counsel must review before live PII (G2) and beta open (G3). **Architecture guidance—not legal advice.**

## Program facts (engineering-supplied)

| Item | Status / note |
| --- | --- |
| Product | DealerHire — automotive labor intelligence / recruiting platform |
| Beta shape | One NY dealer group + one rooftop; English; managed subdomain; concierge |
| Specialist counsel | Retained (per architecture decision register) |
| Design partner | **Not selected** — see [partners/](./partners/README.md) |
| Exact NY/NYC nexus | **Unresolved** until partner facts + counsel |
| Candidate AI | Shadow-only until EmploymentAIUse gate |
| Ad actuation | None in beta (manual + CSV) |
| Role allocation (working) | Dealer = controller/deployer/decision owner; Platform = processor + AI developer/provider — [role-allocation.md](./role-allocation.md) |

## Packet contents checklist

### A. Nexus and policy packs

- [ ] Confirm New York state obligations for partner rooftop jobs (non-remote, single-state).
- [ ] Resolve **NYC applicability** (Local Law 144 and other NYC rules) from partner facts.
- [ ] Identify other local packs if partner nexus is outside NYC but in NY.
- [ ] Approve fail-closed obligation manifest inputs (employee counts, federal contractor, government/union, OEM/franchise, recordkeeping).
- [ ] Sign off first effective-dated `RulePackVersion` before live publish/apply.

### B. Role allocation and contracts

- [ ] Confirm or amend controller / processor / deployer / AI developer-provider allocation.
- [ ] DPA / service provider terms; subprocessor flow-down; international transfer if any.
- [ ] Customer order form / MSA clauses: no contractual four-nines unless evidence exists; media spend billed by platforms to dealer.
- [ ] Bind `RoleAllocationVersion` duties (notice, rights, retention, incident, audit, decisions)—**block launch if unassigned**.
- [ ] Concierge delegation language (what operators may and may not do).

### C. Notices and authority model

- [ ] Application terms.
- [ ] Privacy notice at collection (employer + platform processing).
- [ ] AI-use notice for **shadow** mode and accommodation/alternative route language.
- [ ] Draft live AI notice package (held until candidate-ai gate)—do not enable live use.
- [ ] Transactional email permission model; marketing optional and not required to apply.
- [ ] SMS package deferred—confirm disabled is acceptable.
- [ ] Voluntary demographic notice + segregation requirements.
- [ ] Reject blanket “full release” consent as sole authority.

### D. Candidate AI (shadow)

- [ ] Confirm shadow isolation (invisible; no decision influence) is acceptable for beta under applicable regimes.
- [ ] Advise on NYC AEDT / state ADS/ADMT triggers if any shadow logging or tooling could be argued as “use.”
- [ ] Approve minimization/redaction approach for any external model route.
- [ ] Define documentation platform must keep as AI developer/provider.
- [ ] Review EmploymentAIUse gate criteria before any live exposure ([gates/candidate-ai-release.md](./gates/candidate-ai-release.md)).

### E. Tracking and analytics

- [ ] Default-deny trackers; no third-party scripts on apply/rights/accommodation.
- [ ] GPC / choice handling.
- [ ] Server-side event allowlists; unattributed bucket.
- [ ] Tenant-local operational/descriptive analytics; no cross-tenant first-party benchmarks in beta.
- [ ] Claim-class language (no causation without contract).

### F. Advertising

- [ ] Meta Employment Special Ad Category / Google employment targeting restrictions in compiler.
- [ ] Manual campaign + CSV import posture for beta.
- [ ] Disabled defaults: applicant retargeting, customer lists, protected-trait proxies, person-level hire optimization.
- [ ] Preconditions for future actuation gate.

### G. Retention, rights, holds

- [ ] Retention floors (EEOC/OFCCP + NY/NYC) vs engineering defaults in [data-inventory.md](./data-inventory.md).
- [ ] Access / correction / deletion / accommodation workflows.
- [ ] Legal hold vs deletion.
- [ ] Incident notification timelines dealer ↔ platform.

### H. Pay, selection, and records

- [ ] Universal published min/max pay range product rule vs local law.
- [ ] Job-relatedness / proxy review expectations for requirement versions.
- [ ] DecisionRecord / adverse action expectations for human review path.
- [ ] FCRA boundary: no background/MVR/social dossier features.

### I. Accessibility and language

- [ ] WCAG 2.2 AA English beta.
- [ ] Spanish deferred until parity release—confirm.

## Deliverables counsel returns

1. Written nexus determination (NY + NYC yes/no + other local).  
2. Redlined notices (or approval of drafts).  
3. Confirmed role allocation + contract markups.  
4. Shadow-AI acceptability memo + live-gate requirements.  
5. Retention/rights/incident schedule.  
6. Sign-off checkbox for G2 and G3 (dated).  

## Engineering attachments to send counsel

- [system-map.md](./system-map.md)  
- [role-allocation.md](./role-allocation.md)  
- [data-inventory.md](./data-inventory.md)  
- [purpose-field-retention-matrix.md](./purpose-field-retention-matrix.md)  
- [ADR 0007](./adr/0007-candidate-ai-shadow-mode.md), [0008](./adr/0008-tracking-and-communications.md)  
- Partner dossier + operating facts (when selected)  
- Draft notice copy (when available from UX/content)  

## Sign-off log

| Gate | Counsel sign-off | Date | Notes |
| --- | --- | --- | --- |
| Nexus pack ready | Pending | — | Blocks live partner G0/G3 policy |
| G2 live PII | Pending | — | |
| G3 beta open | Pending | — | |
| Candidate AI live | Pending | — | Separate gate |
| Ad actuation | Pending | — | Separate gate |
