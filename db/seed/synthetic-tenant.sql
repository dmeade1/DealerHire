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
