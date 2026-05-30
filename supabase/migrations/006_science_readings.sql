-- Science module: extended indices metadata + experiment log

alter table satellite_readings add column if not exists science_metadata jsonb;

create table if not exists science_experiments (
  id uuid primary key default gen_random_uuid(),
  crop text not null check (crop in ('wheat', 'corn')),
  field_id text not null references fields(id) on delete cascade,
  zone_id text references zones(id) on delete set null,
  hypothesis text not null default '',
  notes text,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_science_experiments_crop on science_experiments (crop, created_at desc);
create index if not exists idx_science_experiments_field on science_experiments (field_id);

alter table science_experiments enable row level security;

create policy "authenticated read science experiments" on science_experiments
  for select using (auth.role() = 'authenticated');

create policy "authenticated insert science experiments" on science_experiments
  for insert with check (auth.role() = 'authenticated');
