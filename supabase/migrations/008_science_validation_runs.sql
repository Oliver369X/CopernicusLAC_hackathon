-- Validation run history (metrics snapshots)

create table if not exists science_validation_runs (
  id uuid primary key default gen_random_uuid(),
  crop text not null,
  run_at timestamptz not null default now(),
  algorithm_version text not null default '1.0.0',
  model_version text not null default '1.0.0',
  sample_count integer not null default 0,
  metrics jsonb not null default '{}'
);

create index if not exists idx_science_validation_runs_crop on science_validation_runs (crop, run_at desc);

alter table science_validation_runs enable row level security;

create policy "authenticated read validation runs" on science_validation_runs
  for select using (auth.role() = 'authenticated');

create policy "service insert validation runs" on science_validation_runs
  for insert with check (true);
