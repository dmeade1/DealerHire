-- Extend composite (tenant_id, id) FKs across remaining tenant-owned edges.
-- FORCE ROW LEVEL SECURITY
-- Idempotent.

ALTER TABLE platform.teams FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.delegations FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.requisitions FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.listing_revisions FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.requirement_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.audit_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.approval_cases FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.outbox FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.actuation_receipts FORCE ROW LEVEL SECURITY;
ALTER TABLE publication.channel_posting_releases FORCE ROW LEVEL SECURITY;
ALTER TABLE subject.access_capabilities FORCE ROW LEVEL SECURITY;
ALTER TABLE subject.notice_receipts FORCE ROW LEVEL SECURITY;
ALTER TABLE subject.permission_grants FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.decision_records FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.hiring_cases FORCE ROW LEVEL SECURITY;
ALTER TABLE hiring.source_liveness FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.inference_uses FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Unique (tenant_id, id) targets
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_tenant_id_id_key') THEN
    ALTER TABLE platform.teams ADD CONSTRAINT teams_tenant_id_id_key UNIQUE (tenant_id, id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'requisitions_tenant_id_id_key') THEN
    ALTER TABLE hiring.requisitions ADD CONSTRAINT requisitions_tenant_id_id_key UNIQUE (tenant_id, id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'listing_revisions_tenant_id_id_key') THEN
    ALTER TABLE hiring.listing_revisions ADD CONSTRAINT listing_revisions_tenant_id_id_key UNIQUE (tenant_id, id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approval_cases_tenant_id_id_key') THEN
    ALTER TABLE hiring.approval_cases ADD CONSTRAINT approval_cases_tenant_id_id_key UNIQUE (tenant_id, id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'commands_tenant_id_id_key') THEN
    ALTER TABLE hiring.commands ADD CONSTRAINT commands_tenant_id_id_key UNIQUE (tenant_id, id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'envelopes_tenant_id_id_key') THEN
    ALTER TABLE subject.application_acceptance_envelopes
      ADD CONSTRAINT envelopes_tenant_id_id_key UNIQUE (tenant_id, id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_tenant_id_id_key') THEN
    ALTER TABLE subject.applications ADD CONSTRAINT applications_tenant_id_id_key UNIQUE (tenant_id, id);
  END IF;
END
$$;

-- platform.teams
ALTER TABLE platform.teams DROP CONSTRAINT IF EXISTS teams_rooftop_id_fkey;
ALTER TABLE platform.teams DROP CONSTRAINT IF EXISTS teams_tenant_rooftop_fkey;
ALTER TABLE platform.teams
  ADD CONSTRAINT teams_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id) REFERENCES platform.rooftops (tenant_id, id);

-- platform.memberships (nullable rooftop/team)
ALTER TABLE platform.memberships DROP CONSTRAINT IF EXISTS memberships_rooftop_id_fkey;
ALTER TABLE platform.memberships DROP CONSTRAINT IF EXISTS memberships_team_id_fkey;
ALTER TABLE platform.memberships DROP CONSTRAINT IF EXISTS memberships_tenant_rooftop_fkey;
ALTER TABLE platform.memberships DROP CONSTRAINT IF EXISTS memberships_tenant_team_fkey;
ALTER TABLE platform.memberships
  ADD CONSTRAINT memberships_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id) REFERENCES platform.rooftops (tenant_id, id);
ALTER TABLE platform.memberships
  ADD CONSTRAINT memberships_tenant_team_fkey
    FOREIGN KEY (tenant_id, team_id) REFERENCES platform.teams (tenant_id, id);

-- platform.delegations
ALTER TABLE platform.delegations DROP CONSTRAINT IF EXISTS delegations_rooftop_id_fkey;
ALTER TABLE platform.delegations DROP CONSTRAINT IF EXISTS delegations_tenant_rooftop_fkey;
ALTER TABLE platform.delegations
  ADD CONSTRAINT delegations_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id) REFERENCES platform.rooftops (tenant_id, id);

-- hiring.requisitions
ALTER TABLE hiring.requisitions DROP CONSTRAINT IF EXISTS requisitions_rooftop_id_fkey;
ALTER TABLE hiring.requisitions DROP CONSTRAINT IF EXISTS requisitions_tenant_rooftop_fkey;
ALTER TABLE hiring.requisitions
  ADD CONSTRAINT requisitions_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id) REFERENCES platform.rooftops (tenant_id, id);

-- hiring.listing_revisions
ALTER TABLE hiring.listing_revisions DROP CONSTRAINT IF EXISTS listing_revisions_rooftop_id_fkey;
ALTER TABLE hiring.listing_revisions DROP CONSTRAINT IF EXISTS listing_revisions_requisition_id_fkey;
ALTER TABLE hiring.listing_revisions DROP CONSTRAINT IF EXISTS listing_revisions_tenant_rooftop_fkey;
ALTER TABLE hiring.listing_revisions DROP CONSTRAINT IF EXISTS listing_revisions_tenant_requisition_fkey;
ALTER TABLE hiring.listing_revisions
  ADD CONSTRAINT listing_revisions_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id) REFERENCES platform.rooftops (tenant_id, id);
ALTER TABLE hiring.listing_revisions
  ADD CONSTRAINT listing_revisions_tenant_requisition_fkey
    FOREIGN KEY (tenant_id, requisition_id) REFERENCES hiring.requisitions (tenant_id, id);

-- hiring.requirement_versions
ALTER TABLE hiring.requirement_versions DROP CONSTRAINT IF EXISTS requirement_versions_rooftop_id_fkey;
ALTER TABLE hiring.requirement_versions DROP CONSTRAINT IF EXISTS requirement_versions_listing_revision_id_fkey;
ALTER TABLE hiring.requirement_versions DROP CONSTRAINT IF EXISTS requirement_versions_tenant_rooftop_fkey;
ALTER TABLE hiring.requirement_versions DROP CONSTRAINT IF EXISTS requirement_versions_tenant_listing_fkey;
ALTER TABLE hiring.requirement_versions
  ADD CONSTRAINT requirement_versions_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id) REFERENCES platform.rooftops (tenant_id, id);
ALTER TABLE hiring.requirement_versions
  ADD CONSTRAINT requirement_versions_tenant_listing_fkey
    FOREIGN KEY (tenant_id, listing_revision_id) REFERENCES hiring.listing_revisions (tenant_id, id);

-- hiring.job_control_versions (requisition + listing)
ALTER TABLE hiring.job_control_versions DROP CONSTRAINT IF EXISTS job_control_versions_rooftop_id_fkey;
ALTER TABLE hiring.job_control_versions DROP CONSTRAINT IF EXISTS job_control_versions_requisition_id_fkey;
ALTER TABLE hiring.job_control_versions DROP CONSTRAINT IF EXISTS job_control_versions_listing_revision_id_fkey;
ALTER TABLE hiring.job_control_versions DROP CONSTRAINT IF EXISTS jcv_tenant_rooftop_fkey;
ALTER TABLE hiring.job_control_versions DROP CONSTRAINT IF EXISTS jcv_tenant_requisition_fkey;
ALTER TABLE hiring.job_control_versions DROP CONSTRAINT IF EXISTS jcv_tenant_listing_fkey;
ALTER TABLE hiring.job_control_versions
  ADD CONSTRAINT jcv_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id) REFERENCES platform.rooftops (tenant_id, id);
ALTER TABLE hiring.job_control_versions
  ADD CONSTRAINT jcv_tenant_requisition_fkey
    FOREIGN KEY (tenant_id, requisition_id) REFERENCES hiring.requisitions (tenant_id, id);
ALTER TABLE hiring.job_control_versions
  ADD CONSTRAINT jcv_tenant_listing_fkey
    FOREIGN KEY (tenant_id, listing_revision_id) REFERENCES hiring.listing_revisions (tenant_id, id);

-- hiring.audit_runs
ALTER TABLE hiring.audit_runs DROP CONSTRAINT IF EXISTS audit_runs_rooftop_id_fkey;
ALTER TABLE hiring.audit_runs DROP CONSTRAINT IF EXISTS audit_runs_listing_revision_id_fkey;
ALTER TABLE hiring.audit_runs DROP CONSTRAINT IF EXISTS audit_runs_job_control_version_id_fkey;
ALTER TABLE hiring.audit_runs DROP CONSTRAINT IF EXISTS audit_runs_tenant_rooftop_fkey;
ALTER TABLE hiring.audit_runs DROP CONSTRAINT IF EXISTS audit_runs_tenant_listing_fkey;
ALTER TABLE hiring.audit_runs DROP CONSTRAINT IF EXISTS audit_runs_tenant_jcv_fkey;
ALTER TABLE hiring.audit_runs
  ADD CONSTRAINT audit_runs_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id) REFERENCES platform.rooftops (tenant_id, id);
ALTER TABLE hiring.audit_runs
  ADD CONSTRAINT audit_runs_tenant_listing_fkey
    FOREIGN KEY (tenant_id, listing_revision_id) REFERENCES hiring.listing_revisions (tenant_id, id);
ALTER TABLE hiring.audit_runs
  ADD CONSTRAINT audit_runs_tenant_jcv_fkey
    FOREIGN KEY (tenant_id, job_control_version_id) REFERENCES hiring.job_control_versions (tenant_id, id);

-- hiring.approval_cases
ALTER TABLE hiring.approval_cases DROP CONSTRAINT IF EXISTS approval_cases_rooftop_id_fkey;
ALTER TABLE hiring.approval_cases DROP CONSTRAINT IF EXISTS approval_cases_job_control_version_id_fkey;
ALTER TABLE hiring.approval_cases DROP CONSTRAINT IF EXISTS approval_cases_tenant_rooftop_fkey;
ALTER TABLE hiring.approval_cases DROP CONSTRAINT IF EXISTS approval_cases_tenant_jcv_fkey;
ALTER TABLE hiring.approval_cases
  ADD CONSTRAINT approval_cases_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id) REFERENCES platform.rooftops (tenant_id, id);
ALTER TABLE hiring.approval_cases
  ADD CONSTRAINT approval_cases_tenant_jcv_fkey
    FOREIGN KEY (tenant_id, job_control_version_id) REFERENCES hiring.job_control_versions (tenant_id, id);

-- hiring.commands → approval_cases
ALTER TABLE hiring.commands DROP CONSTRAINT IF EXISTS commands_approval_case_id_fkey;
ALTER TABLE hiring.commands DROP CONSTRAINT IF EXISTS commands_tenant_approval_fkey;
ALTER TABLE hiring.commands
  ADD CONSTRAINT commands_tenant_approval_fkey
    FOREIGN KEY (tenant_id, approval_case_id) REFERENCES hiring.approval_cases (tenant_id, id);

-- hiring.outbox / actuation_receipts
ALTER TABLE hiring.outbox DROP CONSTRAINT IF EXISTS outbox_rooftop_id_fkey;
ALTER TABLE hiring.outbox DROP CONSTRAINT IF EXISTS outbox_tenant_rooftop_fkey;
ALTER TABLE hiring.outbox
  ADD CONSTRAINT outbox_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id) REFERENCES platform.rooftops (tenant_id, id);

ALTER TABLE hiring.actuation_receipts DROP CONSTRAINT IF EXISTS actuation_receipts_rooftop_id_fkey;
ALTER TABLE hiring.actuation_receipts DROP CONSTRAINT IF EXISTS actuation_receipts_command_id_fkey;
ALTER TABLE hiring.actuation_receipts DROP CONSTRAINT IF EXISTS actuation_receipts_tenant_rooftop_fkey;
ALTER TABLE hiring.actuation_receipts DROP CONSTRAINT IF EXISTS actuation_receipts_tenant_command_fkey;
ALTER TABLE hiring.actuation_receipts
  ADD CONSTRAINT actuation_receipts_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id) REFERENCES platform.rooftops (tenant_id, id);
ALTER TABLE hiring.actuation_receipts
  ADD CONSTRAINT actuation_receipts_tenant_command_fkey
    FOREIGN KEY (tenant_id, command_id) REFERENCES hiring.commands (tenant_id, id);

-- publication
ALTER TABLE publication.page_releases DROP CONSTRAINT IF EXISTS page_releases_rooftop_id_fkey;
ALTER TABLE publication.page_releases DROP CONSTRAINT IF EXISTS page_releases_job_control_version_id_fkey;
ALTER TABLE publication.page_releases DROP CONSTRAINT IF EXISTS page_releases_previous_release_id_fkey;
ALTER TABLE publication.page_releases DROP CONSTRAINT IF EXISTS page_releases_tenant_rooftop_fkey;
ALTER TABLE publication.page_releases DROP CONSTRAINT IF EXISTS page_releases_tenant_jcv_fkey;
ALTER TABLE publication.page_releases DROP CONSTRAINT IF EXISTS page_releases_tenant_previous_fkey;
ALTER TABLE publication.page_releases
  ADD CONSTRAINT page_releases_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id) REFERENCES platform.rooftops (tenant_id, id);
ALTER TABLE publication.page_releases
  ADD CONSTRAINT page_releases_tenant_jcv_fkey
    FOREIGN KEY (tenant_id, job_control_version_id) REFERENCES hiring.job_control_versions (tenant_id, id);
ALTER TABLE publication.page_releases
  ADD CONSTRAINT page_releases_tenant_previous_fkey
    FOREIGN KEY (tenant_id, previous_release_id) REFERENCES publication.page_releases (tenant_id, id);

ALTER TABLE publication.channel_posting_releases DROP CONSTRAINT IF EXISTS channel_posting_releases_rooftop_id_fkey;
ALTER TABLE publication.channel_posting_releases DROP CONSTRAINT IF EXISTS channel_posting_releases_page_release_id_fkey;
ALTER TABLE publication.channel_posting_releases DROP CONSTRAINT IF EXISTS channel_posting_tenant_rooftop_fkey;
ALTER TABLE publication.channel_posting_releases DROP CONSTRAINT IF EXISTS channel_posting_tenant_page_fkey;
ALTER TABLE publication.channel_posting_releases
  ADD CONSTRAINT channel_posting_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id) REFERENCES platform.rooftops (tenant_id, id);
ALTER TABLE publication.channel_posting_releases
  ADD CONSTRAINT channel_posting_tenant_page_fkey
    FOREIGN KEY (tenant_id, page_release_id) REFERENCES publication.page_releases (tenant_id, id);

-- subject capability / notice / permission → envelopes
ALTER TABLE subject.access_capabilities DROP CONSTRAINT IF EXISTS access_capabilities_envelope_id_fkey;
ALTER TABLE subject.access_capabilities DROP CONSTRAINT IF EXISTS access_capabilities_tenant_envelope_fkey;
ALTER TABLE subject.access_capabilities
  ADD CONSTRAINT access_capabilities_tenant_envelope_fkey
    FOREIGN KEY (tenant_id, envelope_id) REFERENCES subject.application_acceptance_envelopes (tenant_id, id);

ALTER TABLE subject.notice_receipts DROP CONSTRAINT IF EXISTS notice_receipts_envelope_id_fkey;
ALTER TABLE subject.notice_receipts DROP CONSTRAINT IF EXISTS notice_receipts_tenant_envelope_fkey;
ALTER TABLE subject.notice_receipts
  ADD CONSTRAINT notice_receipts_tenant_envelope_fkey
    FOREIGN KEY (tenant_id, envelope_id) REFERENCES subject.application_acceptance_envelopes (tenant_id, id);

ALTER TABLE subject.permission_grants DROP CONSTRAINT IF EXISTS permission_grants_envelope_id_fkey;
ALTER TABLE subject.permission_grants DROP CONSTRAINT IF EXISTS permission_grants_tenant_envelope_fkey;
ALTER TABLE subject.permission_grants
  ADD CONSTRAINT permission_grants_tenant_envelope_fkey
    FOREIGN KEY (tenant_id, envelope_id) REFERENCES subject.application_acceptance_envelopes (tenant_id, id);

-- hiring decisions / cases
ALTER TABLE hiring.decision_records DROP CONSTRAINT IF EXISTS decision_records_rooftop_id_fkey;
ALTER TABLE hiring.decision_records DROP CONSTRAINT IF EXISTS decision_records_application_id_fkey;
ALTER TABLE hiring.decision_records DROP CONSTRAINT IF EXISTS decision_records_tenant_rooftop_fkey;
ALTER TABLE hiring.decision_records DROP CONSTRAINT IF EXISTS decision_records_tenant_application_fkey;
ALTER TABLE hiring.decision_records
  ADD CONSTRAINT decision_records_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id) REFERENCES platform.rooftops (tenant_id, id);
ALTER TABLE hiring.decision_records
  ADD CONSTRAINT decision_records_tenant_application_fkey
    FOREIGN KEY (tenant_id, application_id) REFERENCES subject.applications (tenant_id, id);

ALTER TABLE hiring.hiring_cases DROP CONSTRAINT IF EXISTS hiring_cases_rooftop_id_fkey;
ALTER TABLE hiring.hiring_cases DROP CONSTRAINT IF EXISTS hiring_cases_application_id_fkey;
ALTER TABLE hiring.hiring_cases DROP CONSTRAINT IF EXISTS hiring_cases_job_control_version_id_fkey;
ALTER TABLE hiring.hiring_cases DROP CONSTRAINT IF EXISTS hiring_cases_tenant_rooftop_fkey;
ALTER TABLE hiring.hiring_cases DROP CONSTRAINT IF EXISTS hiring_cases_tenant_application_fkey;
ALTER TABLE hiring.hiring_cases DROP CONSTRAINT IF EXISTS hiring_cases_tenant_jcv_fkey;
ALTER TABLE hiring.hiring_cases
  ADD CONSTRAINT hiring_cases_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id) REFERENCES platform.rooftops (tenant_id, id);
ALTER TABLE hiring.hiring_cases
  ADD CONSTRAINT hiring_cases_tenant_application_fkey
    FOREIGN KEY (tenant_id, application_id) REFERENCES subject.applications (tenant_id, id);
ALTER TABLE hiring.hiring_cases
  ADD CONSTRAINT hiring_cases_tenant_jcv_fkey
    FOREIGN KEY (tenant_id, job_control_version_id) REFERENCES hiring.job_control_versions (tenant_id, id);

ALTER TABLE hiring.source_liveness DROP CONSTRAINT IF EXISTS source_liveness_rooftop_id_fkey;
ALTER TABLE hiring.source_liveness DROP CONSTRAINT IF EXISTS source_liveness_tenant_rooftop_fkey;
ALTER TABLE hiring.source_liveness
  ADD CONSTRAINT source_liveness_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id) REFERENCES platform.rooftops (tenant_id, id);

ALTER TABLE platform.inference_uses DROP CONSTRAINT IF EXISTS inference_uses_rooftop_id_fkey;
ALTER TABLE platform.inference_uses DROP CONSTRAINT IF EXISTS inference_uses_tenant_rooftop_fkey;
ALTER TABLE platform.inference_uses
  ADD CONSTRAINT inference_uses_tenant_rooftop_fkey
    FOREIGN KEY (tenant_id, rooftop_id) REFERENCES platform.rooftops (tenant_id, id);
