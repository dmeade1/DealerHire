# Provider allowlists

Allowlisted external providers and routes for DealerHire. **SELECTION STATUS** tracks Phase 0 decisions. Architectural constraints live in ADRs; this file binds vendors, regions, and beta defaults.

Status values: `Selected` · `Recommended default (unselected)` · `Candidate` · `Deferred` · `Rejected`

## Summary — recommended beta defaults

| Category | Recommended default | SELECTION STATUS |
| --- | --- | --- |
| Identity | **Clerk** or **WorkOS** (org-ready); **Auth0** acceptable | Recommended default (unselected) |
| Postgres | **Neon** or **Supabase Postgres** (pgvector, HA, PITR) | Recommended default (unselected) |
| Email | **Resend** | Recommended default (unselected) |
| Acceptance envelope | **Durable Object** *or* **R2 + D1** (spike both; pick one) | Recommended default (unselected) — decision required |
| Malware scanning | Cloudflare / ecosystem scanner TBD (see below) | Candidate |
| AI routes | **Cloudflare AI Gateway** + pinned models | Recommended default (unselected) — pin before G2 |
| Labor data | Licensed BLS/O\*NET + approved vendor | Candidate |
| Observability | Cloudflare + one APM/log vendor TBD | Candidate |
| Ads | Meta / Google — dealer accounts; **no live actuation in beta** | Deferred actuation |
| SMS | Deferred | Deferred |

---

## 1. Identity

| Field | Value |
| --- | --- |
| SELECTION STATUS | Recommended default (unselected) |
| Allowlist | Clerk; WorkOS; Auth0 |
| Recommended default | **Clerk** or **WorkOS** for organization/SAML/SCIM path; Auth0 if existing enterprise IdP preference |
| Must provide | Passwordless/MFA; org membership; OIDC; SCIM-ready; no custom password store |
| Constraints | ADR 0003; separate dealer vs internal operator apps/tenants as needed |
| Beta action | Select one; document tenant mapping; MFA required from launch |

---

## 2. Managed PostgreSQL (+ pgvector)

| Field | Value |
| --- | --- |
| SELECTION STATUS | Recommended default (unselected) |
| Allowlist | Neon; Supabase Postgres (Postgres-compatible managed with pgvector) |
| Recommended default | **Neon** *or* **Supabase Postgres** — choose on HA/PITR evidence, connection pooling fit with Hyperdrive, and RLS support |
| Must provide | Multi-AZ HA path, PITR (~35-day target), TLS, least-privilege roles, pgvector, backup export |
| Constraints | Hyperdrive **query cache off**; no session-dependent features under pooler; cross-region replica not beta-blocking |
| Rejected for beta | Self-managed VMs; active-active multi-writer |

---

## 3. Email

| Field | Value |
| --- | --- |
| SELECTION STATUS | Recommended default (unselected) |
| Allowlist | Resend; (secondary candidates: Postmark, Amazon SES — only with DPA + suppression APIs) |
| Recommended default | **Resend** |
| Must provide | Transactional API; delivery webhooks; suppression; DPA; no marketing bleed onto apply-critical templates without authz |
| Constraints | ADR 0008; `CommunicationAuthorizationDecision` at enqueue and dispatch |

---

## 4. Application acceptance envelope

| Field | Value |
| --- | --- |
| SELECTION STATUS | **Interim (G1):** Postgres `subject.application_acceptance_envelopes` — **not Selected for G2** |
| Allowlist | Cloudflare **Durable Object** (conditional insert / single-key durability); **R2 + D1** (object + metadata conditional write) |
| Recommended default | Spike both; prefer the option that proves conditional insert, encryption, replay scan, and independence from control-plane Postgres under failure |
| Must provide | Conditional insert; durable across Worker restart; encryption at rest; idempotency key uniqueness; readable by backplane reconciler |
| Constraints | ADR 0004; sole receipt authority; interim Postgres amendment blocks live PII until independent provider Selected |
| Decision record | [ADR 0004 interim amendment](./adr/0004-application-acceptance-envelope.md#interim-store-g1-only--amendment) |

---

## 5. Malware / content scanning

| Field | Value |
| --- | --- |
| SELECTION STATUS | Candidate |
| Allowlist | Cloudflare-native or approved API scanner with quarantine workflow; no resume content used for vendor model training |
| Recommended default | Pick scanner that supports async quarantine + webhook/callback without blocking envelope receipt |
| Must provide | Malware verdict; failure mode compatible with `Quarantined`; DPA |
| Constraints | Receipt must not wait on scanner availability (INV-13) |

---

## 6. AI routes (LLM / embeddings)

| Field | Value |
| --- | --- |
| SELECTION STATUS | Recommended default (unselected) — pin before any applicant-adjacent processing |
| Gateway | **Cloudflare AI Gateway** (required) |
| Allowlist pattern | Exact `provider / model / region` triples with no-training terms, retention, subprocessors, DPA, logging/caching policy, passing eval evidence |
| Recommended default | Pin gateway routes for: (1) listing assist, (2) redacted evidence extraction **shadow**, (3) embeddings for ontology/listings — **no** unapproved aliases; **no** automatic fallback for applicant/regulated outputs |
| Constraints | ADR 0007; raw resumes never leave platform-controlled parsing; InferenceUse records; fail closed |
| Beta | Shadow candidate AI only; listing-side assist may use pinned routes with schema-constrained outputs |

---

## 7. Labor / market data

| Field | Value |
| --- | --- |
| SELECTION STATUS | Candidate |
| Allowlist | BLS / O\*NET / state sources; licensed commercial labor datasets with redistribution terms for in-product benchmarks |
| Recommended default | Start with public BLS/O\*NET + partner historical jobs; add commercial license before dealer-facing percentiles |
| Constraints | Source, date, cohort, sample quality, confidence required on compensation comparisons; AI cannot invent pay |

---

## 8. Object storage / edge platform

| Field | Value |
| --- | --- |
| SELECTION STATUS | Selected (platform) |
| Provider | Cloudflare R2, Queues, Workflows, WAF, Turnstile, Hyperdrive, Workers |
| Notes | Public vs private bucket separation; analytics prefix separate |

---

## 9. Advertising platforms

| Field | Value |
| --- | --- |
| SELECTION STATUS | Deferred (actuation); Candidate (read-only OAuth) |
| Allowlist | Meta Business / Google Ads — **dealer-owned accounts** |
| Beta | Manual launch + signed/manual CSV imports; no live API actuation |
| Later | Read-only OAuth after approval; actuation per [ad-actuation-release](./gates/ad-actuation-release.md) |

---

## 10. ATS

| Field | Value |
| --- | --- |
| SELECTION STATUS | Partial — canonical + CSV/webhook always; named connectors partner-dependent |
| Allowlist | Canonical adapter; CSV / signed webhook; two named connectors after partner demand/access |
| See | [partners/](./partners/README.md) |

---

## 11. SMS

| Field | Value |
| --- | --- |
| SELECTION STATUS | Deferred |
| Allowlist | TBD with registration, quiet hours, revocation, queued cancel |
| Beta | Disabled |

---

## 12. Observability

| Field | Value |
| --- | --- |
| SELECTION STATUS | Candidate |
| Allowlist | Cloudflare logs/metrics + one external APM/error tracker with **PII scrubbing** |
| Constraints | INV-37; synthetic intake probes independent |

---

## Change control

- Adding a provider requires allowlist update, DPA check, and purpose/field matrix rows if personal data flows.
- Model upgrades require versioned eval + rollback target; never silent alias changes.
- Selection flips to `Selected` only with dated note and owner.
