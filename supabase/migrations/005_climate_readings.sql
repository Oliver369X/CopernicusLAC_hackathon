-- C3S climate viability readings

create table if not exists climate_readings (
  id uuid primary key default uuid_generate_v4(),
  field_id text not null references fields(id) on delete cascade,
  captured_at timestamptz not null default now(),
  soil_moisture_anomaly numeric,
  temp_anomaly numeric,
  drought_index numeric,
  viability_score numeric,
  projection_year integer,
  raw_metadata jsonb default '{}'::jsonb
);

create index if not exists idx_climate_field_captured
  on climate_readings (field_id, captured_at desc);

alter table climate_readings enable row level security;

create policy "members read climate" on climate_readings
  for select using (
    field_id in (
      select f.id from fields f
      join organization_members om on om.org_id = f.org_id
      where om.user_id = auth.uid()
    )
  );
