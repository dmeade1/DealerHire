-- Synthetic design partner for engineering skeleton ONLY.
-- Do not use for live applicant traffic.

insert into platform.dealer_groups (id, name, status)
values ('00000000-0000-4000-8000-000000000001', 'North Atlantic Motors Group (SYNTHETIC)', 'active')
on conflict (id) do nothing;

insert into platform.rooftops (id, tenant_id, name, jurisdiction_pack, locality, state_code, remote_jobs_allowed)
values (
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'Albany Service Center (SYNTHETIC)',
  'us-ny-state',
  'Albany',
  'NY',
  false
)
on conflict (id) do nothing;

insert into platform.teams (id, tenant_id, rooftop_id, name)
values (
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  'Fixed Operations'
)
on conflict (id) do nothing;

-- Synthetic job-control chain for demo apply + envelope drills (not live traffic).
insert into hiring.requisitions (
  id, tenant_id, rooftop_id, department, job_family, title, status
) values (
  '00000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  'fixed_operations',
  'technician',
  'ASE Automotive Technician (SYNTHETIC)',
  'published'
)
on conflict (id) do nothing;

insert into hiring.listing_revisions (
  id, tenant_id, rooftop_id, requisition_id, revision_no, payload, content_hash, created_by
) values (
  '00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000004',
  1,
  '{"title":"ASE Automotive Technician","synthetic":true}'::jsonb,
  'synthetic-listing-hash-v1',
  'synthetic:seed'
)
on conflict (id) do nothing;

insert into hiring.job_control_versions (
  id, tenant_id, rooftop_id, requisition_id, listing_revision_id, version_no,
  pay_min_cents, pay_max_cents, pay_unit, qualification_rubric, policy_pack_versions, status
) values (
  '00000000-0000-4000-8000-00000000000a',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000005',
  1,
  2500,
  4500,
  'hour',
  '{"mustHave":["diagnostics"]}'::jsonb,
  '{"pack":"us-ny-state"}'::jsonb,
  'published'
)
on conflict (id) do nothing;
