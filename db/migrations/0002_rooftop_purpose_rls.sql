-- Rooftop + purpose plane enforcement on top of tenant isolation (ADR 0003 / INV-07–08).
-- migrate --check requires this token in every migration file:
-- FORCE ROW LEVEL SECURITY

CREATE OR REPLACE FUNCTION platform.require_tenant_context() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF platform.current_tenant_id() IS NULL THEN
    RAISE EXCEPTION 'missing tenant context';
  END IF;
  IF platform.current_rooftop_id() IS NULL THEN
    RAISE EXCEPTION 'missing rooftop context';
  END IF;
  IF platform.current_purpose() IS NULL THEN
    RAISE EXCEPTION 'missing purpose context';
  END IF;
END;
$$;

-- True when the row's rooftop matches the transaction rooftop.
CREATE OR REPLACE FUNCTION platform.row_rooftop_allowed(row_rooftop uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT row_rooftop IS NOT NULL
     AND platform.current_rooftop_id() IS NOT NULL
     AND row_rooftop = platform.current_rooftop_id()
$$;

-- Purpose planes: platform_control may cross planes; others are plane-scoped.
CREATE OR REPLACE FUNCTION platform.purpose_allows(plane text) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT CASE platform.current_purpose()
    WHEN 'platform_control' THEN true
    WHEN plane THEN true
    ELSE false
  END
$$;

-- Re-assert FORCE RLS (idempotent) so this migration satisfies the static check.
ALTER TABLE platform.rooftops FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.teams FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.delegations FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.requisitions FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.listing_revisions FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.requirement_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.job_control_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.audit_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.approval_cases FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.commands FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.outbox FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.actuation_receipts FORCE ROW LEVEL SECURITY;
ALTER TABLE publication.page_releases FORCE ROW LEVEL SECURITY;
ALTER TABLE publication.channel_posting_releases FORCE ROW LEVEL SECURITY;
ALTER TABLE subject.application_acceptance_envelopes FORCE ROW LEVEL SECURITY;
ALTER TABLE subject.applications FORCE ROW LEVEL SECURITY;
ALTER TABLE subject.access_capabilities FORCE ROW LEVEL SECURITY;
ALTER TABLE subject.notice_receipts FORCE ROW LEVEL SECURITY;
ALTER TABLE subject.permission_grants FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.decision_records FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.hiring_cases FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.source_liveness FORCE ROW LEVEL SECURITY;
ALTER TABLE measurement.observation_admissions FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.inference_uses FORCE ROW LEVEL SECURITY;

-- Replace tenant-only policies.
DROP POLICY IF EXISTS tenant_isolation ON platform.rooftops;
DROP POLICY IF EXISTS tenant_isolation ON platform.teams;
DROP POLICY IF EXISTS tenant_isolation ON platform.memberships;
DROP POLICY IF EXISTS tenant_isolation ON platform.delegations;
DROP POLICY IF EXISTS tenant_isolation ON hiring.requisitions;
DROP POLICY IF EXISTS tenant_isolation ON hiring.listing_revisions;
DROP POLICY IF EXISTS tenant_isolation ON hiring.requirement_versions;
DROP POLICY IF EXISTS tenant_isolation ON hiring.job_control_versions;
DROP POLICY IF EXISTS tenant_isolation ON hiring.audit_runs;
DROP POLICY IF EXISTS tenant_isolation ON hiring.approval_cases;
DROP POLICY IF EXISTS tenant_isolation ON hiring.commands;
DROP POLICY IF EXISTS tenant_isolation ON hiring.outbox;
DROP POLICY IF EXISTS tenant_isolation ON hiring.actuation_receipts;
DROP POLICY IF EXISTS tenant_isolation ON publication.page_releases;
DROP POLICY IF EXISTS tenant_isolation ON publication.channel_posting_releases;
DROP POLICY IF EXISTS tenant_isolation ON subject.application_acceptance_envelopes;
DROP POLICY IF EXISTS tenant_isolation ON subject.applications;
DROP POLICY IF EXISTS tenant_isolation ON subject.access_capabilities;
DROP POLICY IF EXISTS tenant_isolation ON subject.notice_receipts;
DROP POLICY IF EXISTS tenant_isolation ON subject.permission_grants;
DROP POLICY IF EXISTS tenant_isolation ON hiring.decision_records;
DROP POLICY IF EXISTS tenant_isolation ON hiring.hiring_cases;
DROP POLICY IF EXISTS tenant_isolation ON hiring.source_liveness;
DROP POLICY IF EXISTS tenant_isolation ON measurement.observation_admissions;
DROP POLICY IF EXISTS tenant_isolation ON platform.inference_uses;

-- Rooftops: actor may see the current rooftop row (id match).
CREATE POLICY tenant_rooftop_purpose ON platform.rooftops
  USING (
    tenant_id = platform.current_tenant_id()
    AND id = platform.current_rooftop_id()
    AND platform.purpose_allows('hiring_operations')
  );

CREATE POLICY tenant_rooftop_purpose ON platform.teams
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('hiring_operations')
  );

-- Memberships: rooftop-scoped rows require match; tenant-wide (null rooftop) only under platform_control.
CREATE POLICY tenant_rooftop_purpose ON platform.memberships
  USING (
    tenant_id = platform.current_tenant_id()
    AND (
      (rooftop_id IS NOT NULL AND platform.row_rooftop_allowed(rooftop_id)
        AND platform.purpose_allows('hiring_operations'))
      OR (rooftop_id IS NULL AND platform.current_purpose() = 'platform_control')
    )
  );

CREATE POLICY tenant_rooftop_purpose ON platform.delegations
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('hiring_operations')
  );

CREATE POLICY tenant_rooftop_purpose ON hiring.requisitions
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('hiring_operations')
  );

CREATE POLICY tenant_rooftop_purpose ON hiring.listing_revisions
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('hiring_operations')
  );

CREATE POLICY tenant_rooftop_purpose ON hiring.requirement_versions
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('hiring_operations')
  );

CREATE POLICY tenant_rooftop_purpose ON hiring.job_control_versions
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('hiring_operations')
  );

CREATE POLICY tenant_rooftop_purpose ON hiring.audit_runs
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('hiring_operations')
  );

CREATE POLICY tenant_rooftop_purpose ON hiring.approval_cases
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('hiring_operations')
  );

CREATE POLICY tenant_rooftop_purpose ON hiring.commands
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('hiring_operations')
  );

-- Outbox / receipts: tenant + hiring plane (no rooftop column yet).
CREATE POLICY tenant_rooftop_purpose ON hiring.outbox
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.purpose_allows('hiring_operations')
  );

CREATE POLICY tenant_rooftop_purpose ON hiring.actuation_receipts
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.purpose_allows('hiring_operations')
  );

CREATE POLICY tenant_rooftop_purpose ON publication.page_releases
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('publication_disclosure')
  );

CREATE POLICY tenant_rooftop_purpose ON publication.channel_posting_releases
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('publication_disclosure')
  );

CREATE POLICY tenant_rooftop_purpose ON subject.application_acceptance_envelopes
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('subject_permission')
  );

CREATE POLICY tenant_rooftop_purpose ON subject.applications
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('subject_permission')
  );

-- Capability / notice rows inherit envelope rooftop via join — tenant + subject plane for now.
CREATE POLICY tenant_rooftop_purpose ON subject.access_capabilities
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.purpose_allows('subject_permission')
    AND EXISTS (
      SELECT 1 FROM subject.application_acceptance_envelopes e
      WHERE e.id = envelope_id
        AND e.tenant_id = platform.current_tenant_id()
        AND platform.row_rooftop_allowed(e.rooftop_id)
    )
  );

CREATE POLICY tenant_rooftop_purpose ON subject.notice_receipts
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.purpose_allows('subject_permission')
    AND EXISTS (
      SELECT 1 FROM subject.application_acceptance_envelopes e
      WHERE e.id = envelope_id
        AND e.tenant_id = platform.current_tenant_id()
        AND platform.row_rooftop_allowed(e.rooftop_id)
    )
  );

CREATE POLICY tenant_rooftop_purpose ON subject.permission_grants
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.purpose_allows('subject_permission')
    AND EXISTS (
      SELECT 1 FROM subject.application_acceptance_envelopes e
      WHERE e.id = envelope_id
        AND e.tenant_id = platform.current_tenant_id()
        AND platform.row_rooftop_allowed(e.rooftop_id)
    )
  );

CREATE POLICY tenant_rooftop_purpose ON hiring.decision_records
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('hiring_operations')
  );

CREATE POLICY tenant_rooftop_purpose ON hiring.hiring_cases
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('hiring_operations')
  );

CREATE POLICY tenant_rooftop_purpose ON hiring.source_liveness
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.purpose_allows('hiring_operations')
  );

CREATE POLICY tenant_rooftop_purpose ON measurement.observation_admissions
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.purpose_allows('hiring_operations')
    AND purpose = platform.current_purpose()
  );

CREATE POLICY tenant_rooftop_purpose ON platform.inference_uses
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows(purpose)
    AND purpose = platform.current_purpose()
  );
