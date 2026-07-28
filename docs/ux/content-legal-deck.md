# Content & legal copy deck — beta

**Version:** 0.1 · **Date:** 2026-07-28  
**Status:** Structure and placeholder English approved for engineering wiring. **Final legal text requires counsel sign-off for the exact NY nexus pack.**

Copy is referenced by **stable Copy IDs**. UI and envelopes store the ID + content hash, never “whatever string is in the button.”

## How to use

1. Bind screens to Copy IDs ([screen-form-inventory.md](./screen-form-inventory.md)).  
2. At apply time, hash the exact rendered notice bundle into `ApplicationAcceptanceEnvelope`.  
3. Changing text → new version suffix (`COPY-PRIVACY-01.v2`) effective-dated; old applications retain old hash.  
4. Analytics claim strings are product-controlled but counsel-reviewed for causation language.

---

## 1. Application terms

### `COPY-TERMS-01.v1`
**Surface:** Apply + `/legal/application-terms`  
**Purpose:** Application terms (not a blanket waiver)  
**Placeholder:**
> By submitting this application to {DealerName} for {JobTitle}, you certify that your answers are true and complete to the best of your knowledge. Submitting an application does not create an employment contract. {DealerName} is the employer responsible for hiring decisions. DealerHire provides technology services to {DealerName}.

**Must not:** Collapse privacy, AI, SMS, and marketing into this block.

---

## 2. Privacy notice at collection

### `COPY-PRIVACY-01.v1`
**Surface:** Apply + `/legal/privacy`  
**Purpose:** Privacy notice at collection  
**Placeholder:**
> {DealerName} collects the information you provide to evaluate your application for this role and related hiring steps. DealerHire processes this information as a service provider/processor on behalf of {DealerName}. We retain application records according to {DealerName}’s retention schedule and applicable law. You can request access, correction, or other rights using the link in your application receipt. Optional demographic questions, if shown, are voluntary and are not used for hiring decisions.

**Counsel must** replace with nexus-specific disclosures (incl. NYC if applicable).

---

## 3. AI-use / alternative path notice

### `COPY-AI-SHADOW-01.v1`
**Surface:** Apply (required even while AI is shadow-only if counsel requires; otherwise may be deferred—**default: show transparency**)  
**Purpose:** Disclose non-decision use / shadow posture  
**Placeholder:**
> Automated tools may help {DealerName} organize application materials. In this beta, hiring decisions are made by trained human reviewers using your application and resume. Automated tools do not reject applications and do not display match scores to reviewers. If you need an accessible alternative process, use the accommodation link.

### `COPY-AI-LIVE-00` — **NOT USED IN BETA**
Reserved for future `EmploymentAIUse` gate.

---

## 4. Pay disclosure

### `COPY-PAY-01.v1`
**Surface:** Public job, apply header, channel posts  
**Purpose:** Pay transparency  
**Template:**
> Pay range: {comp.base_min}–{comp.base_max} {comp.currency} per {comp.base_period}. {structure_sentence}. Actual pay depends on experience, credentials, and {DealerName} policies.

**Structure sentence examples (system-assembled, counsel-approved patterns):**
- Flat-rate / book-hour roles: include flag rate mechanics summary.  
- Sales: include guarantee/draw/commission summary without requiring prior pay.  

**Must:** Min and max always present for published roles.

---

## 5. EOE / non-discrimination

### `COPY-EOE-01.v1`
**Surface:** Public job footer  
**Placeholder:**
> {DealerName} is an equal opportunity employer. All qualified applicants will receive consideration without regard to protected characteristics under applicable law.

---

## 6. Receipts

### `COPY-RECEIPT-01.v1`
**Surface:** SCR-APP-02  
> Application received. Your application ID is {application_public_id}. Save this page or use the link in your email to check status or update your information. Receiving this confirmation means your application was accepted for processing.

### `COPY-RESUME-PENDING-01.v1`
> Your application was accepted. Your resume is not fully processed yet ({resume_state_human}). You can retry upload using the secure link below. You do not need to submit a new application.

### `COPY-RESUME-QUARANTINE-01.v1`
> Your application was accepted. Your resume is undergoing security review. We will email you if we need a new file. Your application remains in the queue.

### `COPY-EMAIL-RECEIPT-01.v1`
**Subject:** Application received — {JobTitle} at {DealerName}  
**Body:** Mirrors receipt + magic link + accommodation link + privacy link.

---

## 7. Accommodation

### `COPY-ACCOM-01.v1`
**Surface:** Apply, accessibility, self-service  
> Need a reasonable accommodation for the application or interview process? Tell us what you need to participate. You do not need to share a medical diagnosis. We will route your request to {DealerName}. Response times follow business hours unless otherwise required by law.

---

## 8. Correction / privacy / magic-link

### `COPY-CORRECT-01.v1`
> Submit corrections to your application. Trained reviewers will reconsider affected decisions. Significant changes may delay hiring steps.

### `COPY-PRIVACY-REQ-01.v1`
> Submit a privacy request related to your application data. Some records may be retained when required by law or legal holds. You will receive a case ID.

### `COPY-MAGIC-01.v1`
> This secure link lets you view your application. It expires for your security. Request a new link if needed. For sensitive changes, we will verify your email again.

### `COPY-STATUS-01.v1`
> Status updates reflect {DealerName}’s hiring process. Timing varies by role.

---

## 9. Approval / facts / maintenance / support

### `COPY-APPROVAL-01.v1`
**Surface:** Effect manifest  
> You are approving publication of Job Control Version {jcv_id} for {JobTitle}. The manifest below is the exact effect that will become publicly available. Material changes require a new approval.

### `COPY-REQ-PROXY-01.v1`
> Requirements that may act as protected proxies (for example rigid language, personal tool ownership, or uninterrupted experience) need explicit review before publication.

### `COPY-FACTS-BLOCK-01.v1`
> Publication and campaigns are blocked until required operating facts are complete ({missing_fact_codes}). This protects legal compliance.

### `COPY-MAINT-01.v1`
> Applications are temporarily paused for maintenance. Please try again later. If you already received an application ID, your application was kept.

### `COPY-SUPPORT-01.v1`
> DealerHire support is available during defined business hours. Emergency intake and campaign kill switches remain available to platform operators.

### `COPY-REVIEW-01.v1`
**Surface:** Reviewer matrix intro  
> Review each requirement against primary evidence from the application and resume. Treat missing evidence as unknown, not automatic failure. Do not use external social search or unapproved tools. Automated match scores are not provided in this beta.

---

## 10. Analytics claim language (mandatory)

### `COPY-ANALYTICS-CLAIM-01.v1`
**Surface:** Every analytics tile footer  
> Figures are tenant-local and {claim_class}. Spend and outcomes are **associated with** or **allocated to** campaigns and jobs using versioned rules. These views do **not** state that an action **caused** a result.

### `COPY-METRIC-QH-01.v1`
> A **qualified hire** means a trained reviewer confirmed the exact qualification rubric version and the candidate’s start was confirmed. Time is measured from job-control approval to start. Cost includes attributable ad spend plus explicitly allocated campaign-service cost.

### Forbidden strings on beta dashboards
`lift`, `caused`, `causal effect`, `incrementality proven`, `AI recommended reject`, `industry benchmark` (first-party cross-tenant), `guaranteed hire`.

Allowed: `associated with`, `allocated to`, `reconciled spend`, `descriptive`, `operational`, `as of`.

---

## 11. Optional marketing permission

### `COPY-PERM-MARKETING-01.v1`
> Optional: send me occasional recruiting updates unrelated to this application. Not required to apply. You may withdraw anytime.

Transactional email does **not** use this permission.

---

## 12. Version registry

| Copy ID | v | Effective | Counsel | Hash practice |
| --- | --- | --- | --- | --- |
| COPY-TERMS-01 | v1 | pending nexus | pending | sha256 of rendered bytes |
| COPY-PRIVACY-01 | v1 | pending | pending | same |
| COPY-AI-SHADOW-01 | v1 | pending | pending | same |
| COPY-PAY-01 | v1 | pending | pending | template + values |
| COPY-EOE-01 | v1 | pending | pending | same |
| COPY-RECEIPT-01 | v1 | draft | product | same |
| COPY-RESUME-PENDING-01 | v1 | draft | product | same |
| COPY-RESUME-QUARANTINE-01 | v1 | draft | product | same |
| COPY-EMAIL-RECEIPT-01 | v1 | draft | product | same |
| COPY-ACCOM-01 | v1 | pending | pending | same |
| COPY-CORRECT-01 | v1 | draft | product | same |
| COPY-PRIVACY-REQ-01 | v1 | pending | pending | same |
| COPY-MAGIC-01 | v1 | draft | product | same |
| COPY-STATUS-01 | v1 | draft | product | same |
| COPY-APPROVAL-01 | v1 | draft | product | same |
| COPY-REQ-PROXY-01 | v1 | draft | product | same |
| COPY-FACTS-BLOCK-01 | v1 | draft | product | same |
| COPY-MAINT-01 | v1 | draft | product | same |
| COPY-SUPPORT-01 | v1 | draft | product | same |
| COPY-REVIEW-01 | v1 | draft | product | same |
| COPY-ANALYTICS-CLAIM-01 | v1 | draft | pending | same |
| COPY-METRIC-QH-01 | v1 | draft | product | same |
| COPY-PERM-MARKETING-01 | v1 | draft | pending | same |

## 13. Rendering rules

- English only in beta.  
- Dealer name and job title are interpolations, not separately versioned.  
- Pay numbers come from approved compensation fields, not free-typed disclosure.  
- No dark-pattern bundling of optional permissions.  
- Accessibility: notices available as plain text; no info-only-in-color.
