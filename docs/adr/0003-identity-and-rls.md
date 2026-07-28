# ADR 0003: Managed identity and forced tenant/purpose RLS

- **Status:** Accepted
- **Date:** 2026-07-28
- **Deciders:** Architecture / engineering / counsel (role allocation)
- **Related:** [role allocation](../role-allocation.md), [invariant register](../invariant-register.md), [provider allowlists](../provider-allowlists.md)

## Context

DealerHire is multi-tenant (dealer group → rooftop → team). Candidate PII, approvals, vectors, commands, and analytics must not leak across tenants or purpose planes. Custom authentication would create unacceptable security and compliance surface for a solo-founder program.

## Decision

### Identity

- Use a **managed identity provider** (passwordless/MFA from launch).
- Organization-aware authorization; SAML/OIDC and SCIM-ready model.
- **No custom authentication** or password store in-app.
- Separate customer (dealer) identities from internal operator identities.
- Accountless applicants use a public non-secret application ID + hashed rotatable magic-link capability; sensitive actions require step-up via verified email/SMS channel (SMS channel gated separately).

### Authorization and RLS

- Every tenant-owned row carries `tenant_id`; sensitive records also carry owning rooftop and purpose.
- Enforce application authorization **plus** `FORCE ROW LEVEL SECURITY` (or equivalently mandatory secured-function boundary) on every tenant-sensitive candidate, vector, approval, command, and analytics table.
- Runtime roles **may not bypass** RLS.
- Set signed tenant/rooftop/purpose context **transaction-locally**; reject missing context.
- Privileged cross-tenant work requires explicit, expiring delegation recording real actor and `on_behalf_of`.
- MCP/copilot (later) carries signed short-lived actor/tenant/rooftop/purpose/delegation/capability/session context that the command layer reauthorizes; it never receives provider secrets or direct DB bindings.

### Purpose planes

Logical planes in one Postgres deployment (schemas/roles/policies):

1. Hiring operations  
2. Subject / permission  
3. Publication / disclosure  
4. Platform control  

Cross-plane projections are default-deny, copy only allowlisted fields, and retain lineage (source, subject, purpose, authority, audience, version, retention).

## Consequences

- Identity vendor selection (Clerk / WorkOS / Auth0) is in [provider-allowlists.md](../provider-allowlists.md); this ADR binds the security model.
- Integration tests must prove runtime roles cannot bypass tenant/rooftop/purpose rules.
- Operator recovery tools use audited, scoped commands—not direct DB edits.

## Alternatives considered

| Alternative | Why rejected |
| --- | --- |
| App-only tenancy checks without FORCE RLS | Bypass risk via bugs/raw SQL/compromised roles |
| Custom auth | Security/compliance burden; no MFA/org maturity |
| Shared “service role” for Workers | Confused-deputy and blast-radius risk |
| Separate database per tenant | Operational cost; isolation achievable with forced RLS |
