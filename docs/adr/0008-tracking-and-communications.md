# ADR 0008: Default-deny tracking; email-first communications

- **Status:** Accepted
- **Date:** 2026-07-28
- **Deciders:** Architecture / engineering / counsel
- **Related:** [0004](./0004-application-acceptance-envelope.md), [0005](./0005-publication-page-release.md), [counsel packet](../counsel-packet.md)

## Context

Application, rights, and accommodation surfaces process high-sensitivity personal data. Third-party marketing tags and fingerprinting conflict with purpose limitation and GPC/choice obligations. SMS introduces TCPA/state consent complexity that must not block the email-first beta.

## Decision

### Tracking

- **`TrackerPolicyVersion` is default-deny** per tenant/domain/page/purpose.
- **No third-party scripts** on application, rights, or accommodation surfaces.
- Server-side events use field allowlists; strip application tokens and unnecessary URL/referrer data.
- Honor **Global Privacy Control** and applicable choices.
- Prohibit fingerprinting; retain an explicit **unattributed** analytics bucket.
- Measurement admission verifies schema/version, authenticity, purpose authority, and safe-input policy; quarantine never hides a valid application from human review.

### Notices and authority (not blanket consent)

Separate and version:

- Application terms  
- Privacy notice at collection  
- AI-use notice and alternative/accommodation route where required  
- Transactional email and SMS permissions  
- Optional recruiting/marketing choices  
- Voluntary compliance-demographic collection in a segregated vault  
- Purpose-specific export authorization (deferred external system)

Do **not** collapse these into one `ConsentEntry`. Use `NoticeReceipt`, `PermissionGrant`, and `DataUseAuthority` with exact text/version, locale, employer, channel, timestamp, source, withdrawal, and suppression. Optional permissions must not be a condition of applying.

### Communications

- **Transactional email is first-class** in the beta (provider per allowlists; recommended Resend).
- **SMS remains disabled** until sender registration, consent/revocation, quiet-hour, per-send authorization, provider suppression, and queued-message cancellation tests pass.
- Evaluate and persist **`CommunicationAuthorizationDecision`** at both enqueue and dispatch.
- Permission withdrawal blocks future permission-based use immediately and resolves lineage across tables, vectors, caches, exports, and releases.

## Consequences

- Tracking/comms tests cover GPC, field stripping, enqueue/dispatch authz, and no third-party scripts on sensitive pages.
- Counsel reviews notices for exact NY/NYC nexus before live PII (G2/G3).

## Alternatives considered

| Alternative | Why rejected |
| --- | --- |
| Meta/Google pixel on apply pages | Third-party script + employment-ad sensitivity |
| Blanket “full release” checkbox | Not an acceptable authority model |
| SMS in beta | Separate compliance/ops gate incomplete |
| Client-side marketing SDKs for “funnel completeness” | Conflicts with default-deny and GPC |
