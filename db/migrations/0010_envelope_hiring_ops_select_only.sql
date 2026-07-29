-- Fix 0009 purpose widen: hiring_operations may SELECT envelopes/applications only.
-- Intake writes remain subject_permission (WITH CHECK). FORCE ROW LEVEL SECURITY

ALTER TABLE subject.application_acceptance_envelopes FORCE ROW LEVEL SECURITY;
ALTER TABLE subject.applications FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_rooftop_purpose ON subject.application_acceptance_envelopes;
DROP POLICY IF EXISTS envelopes_subject_plane ON subject.application_acceptance_envelopes;
DROP POLICY IF EXISTS envelopes_hiring_ops_read ON subject.application_acceptance_envelopes;

CREATE POLICY envelopes_subject_plane ON subject.application_acceptance_envelopes
  FOR ALL
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('subject_permission')
  )
  WITH CHECK (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('subject_permission')
  );

CREATE POLICY envelopes_hiring_ops_read ON subject.application_acceptance_envelopes
  FOR SELECT
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('hiring_operations')
  );

DROP POLICY IF EXISTS tenant_rooftop_purpose ON subject.applications;
DROP POLICY IF EXISTS applications_subject_plane ON subject.applications;
DROP POLICY IF EXISTS applications_hiring_ops_read ON subject.applications;

CREATE POLICY applications_subject_plane ON subject.applications
  FOR ALL
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('subject_permission')
  )
  WITH CHECK (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('subject_permission')
  );

CREATE POLICY applications_hiring_ops_read ON subject.applications
  FOR SELECT
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.purpose_allows('hiring_operations')
  );
