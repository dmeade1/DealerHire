# ADR 0005: Content-addressed publication via PageRelease

- **Status:** Accepted
- **Date:** 2026-07-28
- **Deciders:** Architecture / engineering
- **Related:** [0001](./0001-modular-monolith.md), [0008](./0008-tracking-and-communications.md), [invariant register](../invariant-register.md)

## Context

Public job pages must remain available when Postgres or the control plane is degraded. Publication must be attributable, rollback-safe, and fail closed on expired or superseded channel releases. Beta experience is English on a managed platform subdomain.

## Decision

- Upload **content-addressed immutable** page/asset objects first (public R2), verify them, then conditionally switch one **`PageRelease`** manifest pointer.
- Public pages read the immutable `PageRelease` manifest and artifacts; they remain **independent of PostgreSQL availability**.
- Rollback switches the pointer to the previous known-good manifest (code/data compensation covered in ADR 0010).
- Bind listing revision, approved role/pay facts, qualification rubric, campaign plan, measurable references, active policy versions, and approved requirements into an immutable **`JobControlVersion`**. Material change creates a successor and invalidates dependent approval/execution authority.
- Compile a **`ChannelPostingRelease`** per page/ad/feed with exact rendered compensation/benefit/application-period disclosures, truncation checks, release/expiry, read-back, tombstone, and cache-purge state.
- Stale/expired channel releases **stop intake** and purge/tombstone correctly.
- Beta: **managed platform subdomain**, **English**, WCAG 2.2 AA, mobile-first. Spanish and dealer custom domains are separate gated releases (locale parity + Cloudflare for SaaS).
- An approved **minimum/maximum base-pay or rate range** plus applicable compensation structure is required for every published role—even where local law would permit omission.
- A named dealer HR or authorized hiring owner approves requirements, compensation facts, qualification rubrics, and publication; a platform operator cannot substitute.

## Consequences

- Publication tests prove artifacts become visible only through one pointer switch.
- Custom hostname activation later requires default-deny hostname routing, hostname-scoped cache/cookie boundaries, and takeover prevention.
- Tracker policy is default-deny per tenant/domain/page/purpose (ADR 0008).

## Alternatives considered

| Alternative | Why rejected |
| --- | --- |
| SSR job pages always hitting Postgres | Couples public availability to DB |
| Mutable “latest” objects without manifests | Weak rollback and attribution |
| Dealer custom domains in beta | Requires SaaS hostname gate and DNS/cert activation states |
| Spanish in beta without full parity | Accessibility/notice parity risk |
