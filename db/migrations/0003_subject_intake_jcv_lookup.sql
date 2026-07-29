-- Allow subject-plane intake to FK-validate published job-control versions (INV-11).
-- FORCE ROW LEVEL SECURITY

ALTER TABLE hiring.job_control_versions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subject_intake_jcv_lookup ON hiring.job_control_versions;

-- Policies OR together: hiring_operations keep existing access; intake may SELECT published JCVs.
CREATE POLICY subject_intake_jcv_lookup ON hiring.job_control_versions
  FOR SELECT
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND platform.current_purpose() = 'subject_permission'
    AND status = 'published'
  );
