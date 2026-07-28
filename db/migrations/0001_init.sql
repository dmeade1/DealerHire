-- DealerHire initial schema — synthetic-safe, tenant-isolated
-- PostgreSQL authority. FORCE RLS on tenant-sensitive tables.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- pgvector enabled when available; skeleton works without it.
-- CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA IF NOT EXISTS platform;
CREATE SCHEMA IF NOT EXISTS hiring;
CREATE SCHEMA IF NOT EXISTS subject;
CREATE SCHEMA IF NOT EXISTS publication;
CREATE SCHEMA IF NOT EXISTS measurement;

-- Session context helpers (set via SET LOCAL in each transaction)
CREATE OR REPLACE FUNCTION platform.current_tenant_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.tenant_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION platform.current_rooftop_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.rooftop_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION platform.current_purpose() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.purpose', true), '')
$$;

CREATE OR REPLACE FUNCTION platform.require_tenant_context() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF platform.current_tenant_id() IS NULL THEN
    RAISE EXCEPTION 'missing tenant context';
  END IF;
  IF platform.current_purpose() IS NULL THEN
    RAISE EXCEPTION 'missing purpose context';
  END IF;
END;
$$;

CREATE TABLE platform.dealer_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE platform.rooftops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  name text NOT NULL,
  jurisdiction_pack text NOT NULL,
  locality text,
  state_code char(2) NOT NULL,
  remote_jobs_allowed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE platform.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  rooftop_id uuid NOT NULL REFERENCES platform.rooftops(id),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE platform.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  rooftop_id uuid REFERENCES platform.rooftops(id),
  team_id uuid REFERENCES platform.teams(id),
  subject_ref text NOT NULL,
  role text NOT NULL CHECK (role IN (
    'dealer_hr_owner',
    'hiring_manager',
    'trained_reviewer',
    'dealer_admin',
    'concierge_operator',
    'recovery_operator'
  )),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE platform.delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  rooftop_id uuid NOT NULL REFERENCES platform.rooftops(id),
  actor_subject_ref text NOT NULL,
  on_behalf_of text NOT NULL,
  capabilities text[] NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE hiring.requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  rooftop_id uuid NOT NULL REFERENCES platform.rooftops(id),
  department text NOT NULL,
  job_family text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE hiring.listing_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  rooftop_id uuid NOT NULL REFERENCES platform.rooftops(id),
  requisition_id uuid NOT NULL REFERENCES hiring.requisitions(id),
  revision_no integer NOT NULL,
  payload jsonb NOT NULL,
  content_hash text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requisition_id, revision_no)
);

CREATE TABLE hiring.requirement_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  rooftop_id uuid NOT NULL REFERENCES platform.rooftops(id),
  listing_revision_id uuid NOT NULL REFERENCES hiring.listing_revisions(id),
  label text NOT NULL,
  essential_function text NOT NULL,
  business_necessity text NOT NULL,
  acceptable_equivalents jsonb NOT NULL DEFAULT '[]'::jsonb,
  accommodation_notes text,
  proxy_reviewed boolean NOT NULL DEFAULT false,
  approved_by text NOT NULL,
  effective_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE hiring.job_control_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  rooftop_id uuid NOT NULL REFERENCES platform.rooftops(id),
  requisition_id uuid NOT NULL REFERENCES hiring.requisitions(id),
  listing_revision_id uuid NOT NULL REFERENCES hiring.listing_revisions(id),
  version_no integer NOT NULL,
  pay_min_cents integer NOT NULL,
  pay_max_cents integer NOT NULL,
  pay_unit text NOT NULL CHECK (pay_unit IN ('hour', 'week', 'month', 'year', 'flat_rate')),
  compensation_structure jsonb NOT NULL DEFAULT '{}'::jsonb,
  qualification_rubric jsonb NOT NULL,
  campaign_plan jsonb NOT NULL DEFAULT '{}'::jsonb,
  policy_pack_versions jsonb NOT NULL,
  measurable_references jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'auditing', 'blocked', 'changes_requested', 'review_ready',
    'approved', 'published', 'closed', 'archived'
  )),
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requisition_id, version_no),
  CHECK (pay_min_cents > 0 AND pay_max_cents >= pay_min_cents)
);

CREATE TABLE hiring.audit_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  rooftop_id uuid NOT NULL REFERENCES platform.rooftops(id),
  listing_revision_id uuid NOT NULL REFERENCES hiring.listing_revisions(id),
  job_control_version_id uuid REFERENCES hiring.job_control_versions(id),
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  hard_blocker_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE hiring.approval_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  rooftop_id uuid NOT NULL REFERENCES platform.rooftops(id),
  job_control_version_id uuid NOT NULL REFERENCES hiring.job_control_versions(id),
  effect_manifest jsonb NOT NULL,
  effect_hash text NOT NULL,
  one_time_token text NOT NULL UNIQUE,
  redeemed_at timestamptz,
  expires_at timestamptz NOT NULL,
  actor text NOT NULL,
  authority_source text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE hiring.commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  rooftop_id uuid NOT NULL REFERENCES platform.rooftops(id),
  job_control_version_id uuid NOT NULL REFERENCES hiring.job_control_versions(id),
  lever text NOT NULL,
  payload_hash text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'executing', 'succeeded', 'failed', 'needs_reconciliation', 'superseded', 'expired'
  )),
  approval_case_id uuid REFERENCES hiring.approval_cases(id),
  idempotency_key text NOT NULL UNIQUE,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX commands_active_conflict_idx
  ON hiring.commands (tenant_id, job_control_version_id, lever)
  WHERE status IN ('queued', 'executing');

CREATE TABLE hiring.outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE TABLE hiring.actuation_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  command_id uuid NOT NULL REFERENCES hiring.commands(id),
  provider text NOT NULL,
  provider_ref text,
  observed_state jsonb NOT NULL,
  confirmed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE publication.page_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  rooftop_id uuid NOT NULL REFERENCES platform.rooftops(id),
  job_control_version_id uuid NOT NULL REFERENCES hiring.job_control_versions(id),
  locale text NOT NULL DEFAULT 'en',
  manifest jsonb NOT NULL,
  content_address text NOT NULL,
  previous_release_id uuid REFERENCES publication.page_releases(id),
  activated_at timestamptz,
  rolled_back_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE publication.channel_posting_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  rooftop_id uuid NOT NULL REFERENCES platform.rooftops(id),
  page_release_id uuid NOT NULL REFERENCES publication.page_releases(id),
  channel text NOT NULL,
  rendered_copy jsonb NOT NULL,
  valid_until timestamptz,
  tombstoned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subject.application_acceptance_envelopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  rooftop_id uuid NOT NULL REFERENCES platform.rooftops(id),
  public_application_id text NOT NULL UNIQUE,
  idempotency_key text NOT NULL UNIQUE,
  job_control_version_id uuid NOT NULL REFERENCES hiring.job_control_versions(id),
  page_release_id uuid REFERENCES publication.page_releases(id),
  structured_payload jsonb NOT NULL,
  notice_hashes jsonb NOT NULL,
  choice_hashes jsonb NOT NULL,
  jurisdiction_snapshot jsonb NOT NULL,
  communication_authority jsonb NOT NULL,
  resume_state text NOT NULL DEFAULT 'none' CHECK (resume_state IN (
    'none', 'pending_upload', 'quarantined', 'scanned_clean', 'scanned_blocked', 'attached'
  )),
  resume_hash text,
  envelope_ciphertext text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  reconciled_at timestamptz
);

CREATE TABLE subject.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  rooftop_id uuid NOT NULL REFERENCES platform.rooftops(id),
  envelope_id uuid NOT NULL UNIQUE REFERENCES subject.application_acceptance_envelopes(id),
  job_control_version_id uuid NOT NULL REFERENCES hiring.job_control_versions(id),
  status text NOT NULL DEFAULT 'received',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subject.access_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  envelope_id uuid NOT NULL REFERENCES subject.application_acceptance_envelopes(id),
  capability_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subject.notice_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  envelope_id uuid NOT NULL REFERENCES subject.application_acceptance_envelopes(id),
  notice_id text NOT NULL,
  text_hash text NOT NULL,
  locale text NOT NULL,
  shown_at timestamptz NOT NULL,
  eligible_at timestamptz NOT NULL
);

CREATE TABLE subject.permission_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  envelope_id uuid NOT NULL REFERENCES subject.application_acceptance_envelopes(id),
  purpose text NOT NULL,
  granted boolean NOT NULL,
  version text NOT NULL,
  withdrawn_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE hiring.decision_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  rooftop_id uuid NOT NULL REFERENCES platform.rooftops(id),
  application_id uuid NOT NULL REFERENCES subject.applications(id),
  reviewer_subject_ref text NOT NULL,
  primary_evidence_reviewed boolean NOT NULL DEFAULT false,
  independent_rationale text NOT NULL,
  system_reliance text NOT NULL DEFAULT 'none' CHECK (system_reliance IN ('none', 'advisory', 'primary')),
  disposition text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE hiring.hiring_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  rooftop_id uuid NOT NULL REFERENCES platform.rooftops(id),
  application_id uuid NOT NULL REFERENCES subject.applications(id),
  job_control_version_id uuid NOT NULL REFERENCES hiring.job_control_versions(id),
  qualified_confirmed_at timestamptz,
  start_confirmed_at timestamptz,
  y90_recorded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE hiring.source_liveness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  source_key text NOT NULL,
  expected_cadence_seconds integer NOT NULL,
  last_heartbeat_at timestamptz,
  state text NOT NULL DEFAULT 'missing' CHECK (state IN ('fresh', 'observed_zero', 'missing', 'stale')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, source_key)
);

CREATE TABLE measurement.observation_admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  purpose text NOT NULL,
  schema_version text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('accepted', 'quarantined', 'rejected')),
  reason text,
  payload_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE measurement.metric_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  version integer NOT NULL,
  claim_class text NOT NULL CHECK (claim_class IN ('operational', 'descriptive', 'predictive', 'causal')),
  definition jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE platform.inference_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES platform.dealer_groups(id),
  rooftop_id uuid NOT NULL REFERENCES platform.rooftops(id),
  purpose text NOT NULL,
  authority_version text NOT NULL,
  model_route text NOT NULL,
  field_manifest jsonb NOT NULL,
  provider_request_id text,
  output_destinations jsonb NOT NULL DEFAULT '[]'::jsonb,
  mode text NOT NULL DEFAULT 'shadow' CHECK (mode IN ('shadow', 'live', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- FORCE RLS
ALTER TABLE platform.rooftops ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.rooftops FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.teams FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.delegations FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring.requisitions FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.listing_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring.listing_revisions FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.requirement_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring.requirement_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.job_control_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring.job_control_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.audit_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring.audit_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.approval_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring.approval_cases FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring.commands FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring.outbox FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.actuation_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring.actuation_receipts FORCE ROW LEVEL SECURITY;
ALTER TABLE publication.page_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE publication.page_releases FORCE ROW LEVEL SECURITY;
ALTER TABLE publication.channel_posting_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE publication.channel_posting_releases FORCE ROW LEVEL SECURITY;
ALTER TABLE subject.application_acceptance_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject.application_acceptance_envelopes FORCE ROW LEVEL SECURITY;
ALTER TABLE subject.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject.applications FORCE ROW LEVEL SECURITY;
ALTER TABLE subject.access_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject.access_capabilities FORCE ROW LEVEL SECURITY;
ALTER TABLE subject.notice_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject.notice_receipts FORCE ROW LEVEL SECURITY;
ALTER TABLE subject.permission_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject.permission_grants FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.decision_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring.decision_records FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.hiring_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring.hiring_cases FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.source_liveness ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring.source_liveness FORCE ROW LEVEL SECURITY;
ALTER TABLE measurement.observation_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement.observation_admissions FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.inference_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.inference_uses FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON platform.rooftops
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON platform.teams
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON platform.memberships
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON platform.delegations
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON hiring.requisitions
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON hiring.listing_revisions
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON hiring.requirement_versions
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON hiring.job_control_versions
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON hiring.audit_runs
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON hiring.approval_cases
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON hiring.commands
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON hiring.outbox
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON hiring.actuation_receipts
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON publication.page_releases
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON publication.channel_posting_releases
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON subject.application_acceptance_envelopes
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON subject.applications
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON subject.access_capabilities
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON subject.notice_receipts
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON subject.permission_grants
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON hiring.decision_records
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON hiring.hiring_cases
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON hiring.source_liveness
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON measurement.observation_admissions
  USING (tenant_id = platform.current_tenant_id());
CREATE POLICY tenant_isolation ON platform.inference_uses
  USING (tenant_id = platform.current_tenant_id());

INSERT INTO measurement.metric_definitions (key, version, claim_class, definition) VALUES
(
  'qualified_hire_cost_time',
  1,
  'descriptive',
  '{
    "numerator": "confirmed_start_with_rubric",
    "clock_start": "job_control_approved_at",
    "clock_end": "start_confirmed_at",
    "cost": ["attributable_ad_spend", "allocated_campaign_service_cost"],
    "language": "associated_with"
  }'::jsonb
);
