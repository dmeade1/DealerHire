# Gate — Candidate AI release (`EmploymentAIUse`)

**Purpose:** Allow candidate AI extraction/classification to leave **shadow mode** and become eligible for reviewer-visible or decision-supporting use.  
**Entry:** G3 beta operating; representative cohort; counsel engagement.  
**Default:** **Fail closed / shadow-only** until every criterion Passes.

This gate is independent of G3 and of ad actuation.

## Hard preconditions

| ID | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| AI-01 | Exact model/configuration/provider route registered (pinned; no auto fallback) | Pending | Model registry |
| AI-02 | Intended use + prohibited uses documented | Pending | EmploymentAIUse record |
| AI-03 | Current jurisdictional `UseAuthorization` for partner nexus (incl. NYC AEDT if applicable) | Pending | Counsel |
| AI-04 | Timely, use-specific AI notice + NoticeDelivery (`eligible_at`, expiry, replacement) | Pending | Notice versions |
| AI-05 | Equivalent manual alternative: same timing, visibility, correction, review standard, outcome | Pending | UAT compare |
| AI-06 | Meaningful human-review protocol + override + independent rationale (DecisionRecord) | Pending | SOP |
| AI-07 | Validation + fairness / bias evidence; subgroup error & correction monitoring plan | Pending | Eval pack |
| AI-08 | Reconsideration path when applicant corrects evidence | Pending | E2E |
| AI-09 | Expiry, rollback target, and kill switch tested | Pending | Drill |
| AI-10 | Raw identifiable resumes still never sent externally; only minimized/redacted evidence on allowlisted routes | Pending | Egress audit |
| AI-11 | Shadow isolation tests remain green until cutover; cutover feature-flagged per tenant | Pending | Tests |
| AI-12 | RoleAllocationVersion updated (deployer / developer / provider duties) | Pending | role-allocation |
| AI-13 | InferenceUse + deletable outputs; telemetry still PII-free | Pending | Design review |
| AI-14 | Prompt-injection / exfiltration evals pass for resume/listing corpora | Pending | Eval report |
| AI-15 | Counsel written approval to enable live EmploymentAIUse | Pending | Memo |

## Cutover rules

1. Enable per tenant/rooftop/purpose with kill switch.  
2. Do not feed live AI outputs into campaigns or beta causal claims without separate analytics contracts.  
3. Any model/provider change reopens AI-01, AI-07, AI-09, AI-14.  
4. Withdrawal of authorization immediately disables live use and reverts to equivalent manual path.

## Sign-off

| Role | Name | Date | Result |
| --- | --- | --- | --- |
| AI / engineering | | | |
| Fairness / eval owner | | | |
| Counsel | | | |
| Dealer deployer (partner) | | | |
| Program owner | | | |

**Gate result:** ☐ Pass · ☐ Fail · ☐ Remain shadow-only  

Related: [ADR 0007](../adr/0007-candidate-ai-shadow-mode.md), [counsel-packet.md](../counsel-packet.md).
