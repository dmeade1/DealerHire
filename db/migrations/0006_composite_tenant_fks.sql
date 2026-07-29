-- Composite tenant-scoped FKs so envelope/command rows cannot reference foreign tenants.
-- FORCE ROW LEVEL SECURITY
-- Idempotent: safe to re-apply after partial failure.

ALTER TABLE platform.rooftops FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.job_control_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE publication.page_releases FORCE ROW LEVEL SECURITY;
ALTER TABLE subject.application_acceptance_envelopes FORCE ROW LEVEL SECURITY;
ALTER TABLE subject.applications FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.commands FORCE ROW LEVEL SECURITY;

-- Subject-plane intake must SELECT the current rooftop to validate tenant binding.
DROP POLICY IF EXISTS subject_intake_rooftop_lookup ON platform.rooftops;
CREATE POLICY subject_intake_rooftop_lookup ON platform.rooftops
  FOR SELECT
  USING (
    tenant_id = platform.current_tenant_id()
    AND id = platform.current_rooftop_id()
    AND platform.current_purpose() = 'subject_permission'
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rooftops_tenant_id_id_key'
  ) THEN
    ALTER TABLE platform.rooftops
      ADD CONSTRAINT rooftops_tenant_id_id_key UNIQUE (tenant_id, id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'job_control_versions_tenant_id_id_key'
  ) THEN
    ALTER TABLE hiring.job_control_versions
      ADD CONSTRAINT job_control_versions_tenant_id_id_key UNIQUE (tenant_id, id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'page_releases_tenant_id_id_key'
  ) THEN
    ALTER TABLE publication.page_releases
      ADD CONSTRAINT page_releases_tenant_id_id_key UNIQUE (tenant_id, id);
  END IF;
END
$$;

-- Replace single-column FKs with composite tenant-scoped FKs.
ALTER TABLE subject.application_acceptance_envelopes
  DROP CONSTRAINT IF EXISTS application_acceptance_envelopes_rooftop_id_fkey;
ALTER TABLE subject.application_acceptance_envelopes
  DROP CONSTRAINT IF EXISTS application_acceptance_envelopes_job_control_version_id_fkey;
ALTER TABLE subject.application_acceptance_envelopes
  DROP CONSTRAINT IF EXISTS application_acceptance_envelopes_page_release_id_fkey;
ALTER TABLE subject.application_acceptance_envelopes
  DROP CONSTRAINT IF EXISTS envelopes_tenant_rooftop_fkey;
ALTER TABLE subject.application_acceptance_envelopes
  DROP CONSTRAINT IF EXISTS envelopes_tenant_jcv_fkey;
ALTER TABLE subject.application_acceptance_envelopes
  DROP CONSTRAINT IF EXISTS envelopes_tenant_page_release_fkey;

ALTER TABLE subject.application_acceptance_envelopes
  ADD CONSTRAINT envelopes_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id)
    REFERENCES platform.rooftops (tenant_id, id);

ALTER TABLE subject.application_acceptance_envelopes
  ADD CONSTRAINT envelopes_tenant_jcv_fkey
    FOREIGN KEY (tenant_id, job_control_version_id)
    REFERENCES hiring.job_control_versions (tenant_id, id);

ALTER TABLE subject.application_acceptance_envelopes
  ADD CONSTRAINT envelopes_tenant_page_release_fkey
    FOREIGN KEY (tenant_id, page_release_id)
    REFERENCES publication.page_releases (tenant_id, id);

ALTER TABLE subject.applications
  DROP CONSTRAINT IF EXISTS applications_rooftop_id_fkey;
ALTER TABLE subject.applications
  DROP CONSTRAINT IF EXISTS applications_job_control_version_id_fkey;
ALTER TABLE subject.applications
  DROP CONSTRAINT IF EXISTS applications_tenant_rooftop_fkey;
ALTER TABLE subject.applications
  DROP CONSTRAINT IF EXISTS applications_tenant_jcv_fkey;

ALTER TABLE subject.applications
  ADD CONSTRAINT applications_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id)
    REFERENCES platform.rooftops (tenant_id, id);

ALTER TABLE subject.applications
  ADD CONSTRAINT applications_tenant_jcv_fkey
    FOREIGN KEY (tenant_id, job_control_version_id)
    REFERENCES hiring.job_control_versions (tenant_id, id);

ALTER TABLE hiring.commands
  DROP CONSTRAINT IF EXISTS commands_rooftop_id_fkey;
ALTER TABLE hiring.commands
  DROP CONSTRAINT IF EXISTS commands_job_control_version_id_fkey;
ALTER TABLE hiring.commands
  DROP CONSTRAINT IF EXISTS commands_tenant_rooftop_fkey;
ALTER TABLE hiring.commands
  DROP CONSTRAINT IF EXISTS commands_tenant_jcv_fkey;

ALTER TABLE hiring.commands
  ADD CONSTRAINT commands_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id)
    REFERENCES platform.rooftops (tenant_id, id);

ALTER TABLE hiring.commands
  ADD CONSTRAINT commands_tenant_jcv_fkey
    FOREIGN KEY (tenant_id, job_control_version_id)
    REFERENCES hiring.job_control_versions (tenant_id, id);
