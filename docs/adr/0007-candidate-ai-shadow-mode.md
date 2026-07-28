# ADR 0007: Candidate AI shadow-only until EmploymentAIUse gate

- **Status:** Accepted
- **Date:** 2026-07-28
- **Deciders:** Architecture / engineering / counsel
- **Related:** [gates/candidate-ai-release.md](../gates/candidate-ai-release.md), [role allocation](../role-allocation.md), [provider allowlists](../provider-allowlists.md)

## Context

AI extraction and evidence classification of applicant materials are presumptively regulated by function (including NYC AEDT and other state ADS/ADMT regimes), not by whether a numeric score is shown. Premature reviewer-visible AI creates notice, bias-audit, and meaningful-review obligations before the product can meet them.

## Decision

### Beta posture

- Candidate AI extraction and classifications (including signals such as “confirmed,” “transferable,” “gap”) run in **shadow mode only**.
- Shadow outputs are **invisible** to decision-makers and **cannot affect** review, disposition, communication, campaigns, or analytics.
- Operative beta review is a trained dealer reviewer’s **requirement-by-requirement evidence matrix** from primary application/resume evidence—no composite score, hidden ranking, or automatic rejection.
- Every applicant remains visible in neutral order; absence is unknown; adverse facts verified against primary evidence.
- Equivalent **non-AI path** is authoritative until the regulated-use gate passes; only processing method may differ (same timing, visibility, correction, review standard, outcome).

### Model / data boundaries

- Route LLM and embedding calls through **Cloudflare AI Gateway** with **pinned** provider/model/region routes—no unapproved aliases or automatic fallback for applicant or regulated outputs.
- **Raw resumes or identifiable applicant content are not sent to external models.** Only minimized/redacted evidence may leave platform-controlled parsing under the approved route.
- Untrusted content remains inert: no tools, credentials, cross-tenant retrieval, or arbitrary egress for content-processing models.
- Record deletable, purpose-scoped **`InferenceUse`** for every call without storing raw prompts in immutable telemetry.
- Listing-side AI recommendations may be schema-constrained and evidence-linked; accepting one creates a new listing revision and invalidates dependent approvals. AI may not invent compensation or certify compliance.

### Release to live use

Live `EmploymentAIUse` requires the [candidate-ai-release](../gates/candidate-ai-release.md) gate: exact model/configuration and intended-use registration, current jurisdictional `UseAuthorization`, timely notice, validation/fairness evidence, subgroup monitoring, equivalent manual alternative, meaningful human-review protocol, reconsideration, expiry, rollback, and kill switch—with current counsel approval.

## Consequences

- Shadow isolation tests are mandatory before any reviewer UI that could surface AI signals.
- Provider allowlist binds no-training terms, retention, DPA, logging, and caching per route.
- NYC Local Law 144 and other regimes are evaluated by counsel against exact nexus and feature function.

## Alternatives considered

| Alternative | Why rejected |
| --- | --- |
| Reviewer-visible AI in beta | Regulated-use obligations before evidence/notices ready |
| Score-based ranking | Opaque adverse impact; contradicts human primary-evidence model |
| Unpinned model fallback | Eval/fairness and provenance break |
| Sending full resumes to external LLMs | PII exfiltration and training-risk surface |
