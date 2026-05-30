-- Science Lab: normalized timeseries, validation labels, flexible crop enum

alter table science_experiments drop constraint if exists science_experiments_crop_check;

create table if not exists science_timeseries (
  id uuid primary key default gen_random_uuid(),
  zone_id text not null references zones(id) on delete cascade,
  field_id text not null references fields(id) on delete cascade,
  crop text not null,
  captured_at timestamptz not null default now(),
  optical jsonb not null default '{}',
  radar jsonb not null default '{}',
  lst numeric,
  algorithm_version text not null default '1.0.0',
  fusion_score_rules numeric,
  fusion_score_ml numeric,
  health_label_rules text,
  health_label_ml text,
  anomaly_flags jsonb default '[]'
);

create index if not exists idx_science_ts_zone_time on science_timeseries (zone_id, captured_at desc);
create index if not exists idx_science_ts_crop on science_timeseries (crop, captured_at desc);

create table if not exists science_validation_labels (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid,
  field_id text references fields(id) on delete cascade,
  zone_id text references zones(id) on delete set null,
  crop text not null,
  disease_label text,
  severity text check (severity in ('none', 'low', 'medium', 'high', 'critical')),
  health_label text check (health_label in ('excellent', 'good', 'warning', 'critical')),
  lat numeric,
  lng numeric,
  validated_by uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_science_validation_crop on science_validation_labels (crop, created_at desc);

alter table science_timeseries enable row level security;
alter table science_validation_labels enable row level security;

create policy "authenticated read science timeseries" on science_timeseries
  for select using (auth.role() = 'authenticated');

create policy "service insert science timeseries" on science_timeseries
  for insert with check (true);

create policy "authenticated read validation labels" on science_validation_labels
  for select using (auth.role() = 'authenticated');

create policy "authenticated insert validation labels" on science_validation_labels
  for insert with check (auth.role() = 'authenticated');
