-- Doctor Soya: real satellite data (Copernicus S1/S2/S3) + NASA FIRMS

alter table satellite_readings add column if not exists s1_vh numeric;
alter table satellite_readings add column if not exists s1_vv numeric;
alter table satellite_readings add column if not exists s1_moisture_index numeric;
alter table satellite_readings add column if not exists s3_lst numeric;
alter table satellite_readings add column if not exists cloud_cover numeric;
alter table satellite_readings add column if not exists ndvi_grid jsonb;
alter table satellite_readings add column if not exists scene_date timestamptz;
alter table satellite_readings add column if not exists reading_date date default (current_date);

create index if not exists idx_satellite_zone_captured
  on satellite_readings (zone_id, captured_at desc);

create unique index if not exists idx_satellite_zone_day
  on satellite_readings (zone_id, reading_date);

alter table weather_readings add column if not exists soil_moisture numeric;
alter table weather_readings add column if not exists et0 numeric;

alter table observations add column if not exists image_url text;

create table if not exists fire_detections (
  id uuid primary key default uuid_generate_v4(),
  field_id text references fields(id) on delete cascade,
  detected_at timestamptz not null,
  lat numeric,
  lng numeric,
  confidence numeric,
  satellite text,
  source text default 'nasa_firms',
  raw_metadata jsonb default '{}'::jsonb
);

create index if not exists idx_fire_field_detected
  on fire_detections (field_id, detected_at desc);

alter table fire_detections enable row level security;

create policy "members read fire detections" on fire_detections
  for select using (
    field_id in (
      select f.id from fields f
      join organization_members om on om.org_id = f.org_id
      where om.user_id = auth.uid()
    )
  );
