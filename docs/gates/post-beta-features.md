# Post-beta independent release gates

These features are **not** beta dependencies. Each has its own stop/go evidence.

## Candidate AI release (`EmploymentAIUse`)

**Current mode:** shadow-only — outputs inaccessible to reviewers, applicants, campaigns, communications, analytics.

Go only when:

- Exact model/configuration/use and pinned provider route registered
- Current counsel approval + jurisdictional `UseAuthorization`
- Timely notices and equivalent manual service proven equal in timing/outcome
- Subgroup error, fidelity, correction, drift, protected-signal, prompt-injection thresholds pass
- Meaningful review, reconsideration, monitoring, expiry, rollback, kill switch demonstrated
- Representative shadow cohort exists

Stop: insufficient evidence, expired authorization, unequal manual path, failed rollback.

## Ad actuation

**Current mode:** disabled. Manual Meta/Google + CSV import only.

Go only when:

- Provider approval + read-only OAuth reconciliation proven
- Sandbox tests: approval binding, idempotency, atomic command/outbox, ambiguous outcomes, limits, liveness, emergency pause
- Explicit dealer standing authority / exact-payload approval for material actions
- Start with one account and bounded low-risk actions

Stop: stale authorization, budget, connection, policy, or observed state.

## Spanish parity

Complete notice/workflow/page parity release; WCAG in Spanish; counsel copy versions.

## SMS

Sender registration, consent/revocation, quiet hours, per-send `CommunicationAuthorizationDecision`, suppression, queued cancellation.

## Custom dealer domains

Cloudflare for SaaS custom hostnames, activation states, default-deny routing, takeover prevention.

## Cross-tenant intelligence

Disclosure query budget + `CompetitionPolicyVersion` + counsel — never during pilot.
