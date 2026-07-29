-- Dealer hiring_operations may SELECT acceptance envelopes for inventory (INV-11 list).
-- Intake remains subject_permission for insert path. FORCE ROW LEVEL SECURITY

ALTER TABLE subject.application_acceptance_envelopes FORCE ROW LEVEL SECURITY;
ALTER TABLE subject.applications FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_rooftop_purpose ON subject.application_acceptance_envelopes;
CREATE POLICY tenant_rooftop_purpose ON subject.application_acceptance_envelopes
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND (
      platform.purpose_allows('subject_permission')
      OR platform.purpose_allows('hiring_operations')
    )
  );

DROP POLICY IF EXISTS tenant_rooftop_purpose ON subject.applications;
CREATE POLICY tenant_rooftop_purpose ON subject.applications
  USING (
    tenant_id = platform.current_tenant_id()
    AND platform.row_rooftop_allowed(rooftop_id)
    AND (
      platform.purpose_allows('subject_permission')
      OR platform.purpose_allows('hiring_operations')
    )
  );
