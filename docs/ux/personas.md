# Behavioral personas — beta

**Version:** 0.1 · **Date:** 2026-07-28  
Personas describe **jobs-to-be-done, constraints, and failure modes**—not demographics. Counsel is a stakeholder, not a product user.

## Persona map

| ID | Persona | Surface | Primary journeys |
| --- | --- | --- | --- |
| P-APP | Mobile applicant | Public / self-service | Apply, receipt, correction, privacy, accommodation |
| P-HR | Dealer HR owner | Dealer control plane | Onboarding facts, approve req/pay/rubric/publish, compliance |
| P-HM | Hiring manager | Dealer control plane (limited) | Draft context, view pipeline, schedule notes (no protected data) |
| P-REV | Trained reviewer | Dealer control plane | Evidence matrix → disposition → milestones → start |
| P-ADM | Dealer admin | Dealer control plane | Users/teams, brand site config, ad CSV upload, ATS mapping |
| P-CON | Concierge operator | Internal ops (delegated) | Assisted listing/campaign ops under explicit delegation |
| P-REC | Recovery / compliance operator | Internal ops | Replay, quarantine, rights cases, kill switches |
| S-LAW | Counsel (stakeholder) | Packets / review | Notices, nexus, role allocation, AI shadow boundary |

---

## P-APP — Mobile applicant

### Context
Job seeker on a phone, often between shifts. Low trust of “black box” hiring tools. Needs clear pay, durable proof of apply, and a way to fix mistakes without creating an account.

### Goals
- Understand role, location, schedule, and published pay range/structure.
- Submit application + resume with minimal friction.
- Receive a receipt they can reopen later.
- Correct information, request privacy actions, or request accommodation.

### Behaviors
- Abandons long multi-step wizards; prefers 1–2 screens + confirm.
- May lose email access; needs anti-enumeration-safe recovery guidance.
- May apply during degraded network; retries aggressively (idempotency critical).
- May need screen reader / large text / keyboard-only path.

### Pain / fears
- “Did it go through?” after spinner.
- Forced account creation.
- Opaque AI screening.
- Pay omitted or unclear.

### Success criteria
- Completes apply→receipt unassisted (≥90% usability bar).
- Can reopen status via magic-link after step-up when needed.
- Never sees candidate-AI scores or protected demographic reuse.

### Must never see
- Other applicants; internal findings; shadow AI; compliance vault fields; operator tooling.

---

## P-HR — Dealer HR / authorized hiring owner

### Context
Accountable for legal listing facts, requirements job-relatedness, pay transparency, and publication. Named sponsor for the design partner. Weekly UAT participant.

### Goals
- Approve (or reject) requirements, compensation, rubric, and publication.
- See audit findings: hard blockers vs required human actions vs advisory.
- Know policy pack / nexus status and what’s blocking launch.
- Confirm qualified-hire outcomes with correct rubric version.

### Behaviors
- Will not rubber-stamp opaque scores.
- Needs version diffs when material fields change.
- Escalates to counsel when nexus facts incomplete.

### Success criteria
- Can complete listing→audit→approval→publication without operator substituting approval.
- Sees exact effect of approval (what will publish).
- Cannot access protected demographics for decision-making.

### Authority
Only this persona (or formally delegated hiring owner) may approve req/pay/rubric/publication for the rooftop.

---

## P-HM — Hiring manager

### Context
Needs headcount filled; knows schedule, must-haves vs trainable skills, urgency. Not the compliance owner.

### Goals
- Provide hiring context for drafts/imports.
- Track pipeline milestones without legal liability UI.
- Coordinate interviews/offers as employer-owned process notes.

### Behaviors
- Skims; wants “what’s blocked” and “who’s waiting on me.”
- May push for faster reject—system must keep human evidence standard.

### Constraints
- Cannot approve publication or override HR approvals.
- Cannot see protected demographics or shadow AI.
- Cannot edit notice versions or policy packs.

---

## P-REV — Trained reviewer

### Context
Dealer employee trained on the evidence-matrix protocol. Owns qualification and disposition decisions recorded in `DecisionRecord`.

### Goals
- Review every applicant in neutral order.
- Mark each requirement: evidence present / absent / needs verification.
- Record independent rationale; confirm rubric for qualified hire.
- Capture milestones through confirmed start.

### Behaviors
- Works from resume + structured answers as primary evidence.
- Treats absence as unknown, not fail.
- Needs accommodation/correction flags visible without medical detail oversharing.

### Must never see
- Composite match scores, AI “confirmed/transferable/gap” labels, protected demographics, cross-tenant pools.

### Success criteria
- Completes review→disposition without AI assistance.
- DecisionRecord captures reviewer, evidence basis, authority, override capability.

---

## P-ADM — Dealer administrator

### Context
Owns seat access, brand presentation on managed subdomain, CSV campaign imports, ATS connection hygiene.

### Goals
- Invite/deactivate members; assign rooftop-scoped roles.
- Configure locale (English), brand assets for `PageRelease`.
- Import Meta/Google CSV; see reconciliation status.
- Maintain ATS mapping with technical contact.

### Behaviors
- Operational, checklist-driven.
- Needs clear `NeedsReconciliation` vs success.

### Constraints
- Cannot approve job-control content unless also holding HR owner capability.
- Cannot bypass tenant/purpose RLS via admin UI.

---

## P-CON — Concierge operator (internal)

### Context
Platform staff assisting one tenant under **explicit, expiring delegation**. Executes distribution/support work; does not become employer decision-maker.

### Goals
- Help draft listings, run audits, import CSVs, triage ATS failures.
- Propose actions that still require dealer approval where authority demands it.
- Leave complete audit trail (`actor` + `on_behalf_of`).

### Behaviors
- Works across tools quickly; risks overreach without UX guardrails.
- Must see delegation banner on every tenant-scoped screen.

### Hard stops (UI enforced)
- Cannot approve requirements/pay/rubric/publication for the dealer.
- Cannot grant spend increases, targeting exceptions, or policy exceptions without dealer authority.
- Cannot view protected demographics vault.
- Cannot make candidate AI visible.

---

## P-REC — Recovery / compliance operator (internal)

### Context
Handles incidents, DLQ/outbox replay, quarantine, privacy requests, legal holds, kill switches. Highest operational privilege with strongest audit.

### Goals
- Inspect envelope/application state without leaking PII into logs.
- Replay from acceptance envelope; resolve `PendingUpload` / `Quarantined`.
- Process privacy/accommodation escalations with counsel as needed.
- Pause intake or campaigns via kill switch.

### Behaviors
- Prefers audited CLI + minimal ops page parity.
- Never “just fix in SQL.”

### Constraints
- Cross-tenant actions require purpose + delegation + dual control where configured.
- Exports are allowlisted and receipted.

---

## S-LAW — Counsel (stakeholder)

### Not a login persona for beta product UX
Reviews and owns:

- Exact NY state/local nexus pack (incl. NYC if applicable)
- Controller / deployer / processor role allocation
- Notice and AI-shadow boundary copy
- Retention, tracking, communications, contracts
- Approval of any future `EmploymentAIUse` release

### UX implications
- All notice surfaces bind to versioned copy IDs ([content-legal-deck.md](./content-legal-deck.md)).
- UI must expose “which notice version was shown” on receipts and audits.
- Fail-closed blocked states must be counsel-legible (policy pack / missing fact codes).

---

## Cross-persona rules

| Rule | Applies |
| --- | --- |
| Candidate AI invisible | All dealer + applicant personas; ops see only shadow eval in non-decision tooling if ever exposed internally—**not** in beta decision UIs |
| Protected demographics inaccessible | P-HR, P-HM, P-REV, P-ADM, P-CON for decisions; compliance analysis only via segregated path |
| Delegation visible | P-CON, P-REC whenever acting for tenant |
| Business-hours support messaging | Applicant help and dealer support widgets; kill switches always available to P-REC |

## UAT casting (minimum)

| Journey | Primary tester | Observer |
| --- | --- | --- |
| Apply → receipt | P-APP (3+ representative) | P-HR |
| Listing → publish | P-HR | P-CON |
| Review → start | P-REV | P-HR |
| CSV reconciliation | P-ADM | P-CON |
| Rights / accommodation | P-APP | S-LAW review of copy |
| Operator recovery | P-REC | Eng |
