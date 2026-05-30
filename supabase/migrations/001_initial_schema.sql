-- Doctor Soya initial schema

create extension if not exists "uuid-ossp";

create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists organization_members (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table if not exists fields (
  id text primary key,
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  crop_type text not null,
  area_ha numeric not null,
  center_lat numeric not null,
  center_lng numeric not null,
  bounds jsonb not null,
  location_label text,
  planting_date date,
  days_from_planting integer default 0,
  overall_health text not null default 'good',
  risk_score integer default 0,
  notifications integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists zones (
  id text primary key,
  field_id text not null references fields(id) on delete cascade,
  name text not null,
  area_ha numeric not null,
  bounds jsonb not null,
  health text not null default 'good',
  ndvi_average numeric not null default 0,
  ndmi_average numeric not null default 0,
  temperature_average numeric not null default 0,
  soil_moisture_average numeric not null default 0,
  observation_count integer default 0,
  disease_risks jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists observations (
  id text primary key,
  field_id text not null references fields(id) on delete cascade,
  zone_id text references zones(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  notes text default '',
  lat numeric,
  lng numeric,
  image_path text,
  vision_result jsonb,
  synced_at timestamptz default now(),
  created_at timestamptz not null default now()
);

create table if not exists satellite_readings (
  id uuid primary key default uuid_generate_v4(),
  zone_id text not null references zones(id) on delete cascade,
  captured_at timestamptz not null default now(),
  ndvi numeric not null,
  ndmi numeric not null,
  source text not null default 'sentinel',
  raw_metadata jsonb default '{}'::jsonb
);

create table if not exists weather_readings (
  id uuid primary key default uuid_generate_v4(),
  field_id text not null references fields(id) on delete cascade,
  captured_at timestamptz not null default now(),
  temp numeric,
  humidity numeric,
  precipitation numeric,
  wind numeric,
  raw_metadata jsonb default '{}'::jsonb
);

create table if not exists alerts (
  id uuid primary key default uuid_generate_v4(),
  field_id text not null references fields(id) on delete cascade,
  zone_id text references zones(id) on delete set null,
  type text not null,
  severity text not null,
  title text not null,
  description text not null,
  recommendation text not null,
  metrics jsonb default '{}'::jsonb,
  resolved boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists alert_settings (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  config jsonb not null default '{}'::jsonb,
  unique (org_id, user_id)
);

create table if not exists push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table fields enable row level security;
alter table zones enable row level security;
alter table observations enable row level security;
alter table satellite_readings enable row level security;
alter table weather_readings enable row level security;
alter table alerts enable row level security;
alter table alert_settings enable row level security;
alter table push_subscriptions enable row level security;

create or replace function public.user_org_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select org_id from organization_members where user_id = auth.uid();
$$;

create policy "members read orgs" on organizations for select
  using (id in (select public.user_org_ids()));

create policy "members read membership" on organization_members for select
  using (org_id in (select public.user_org_ids()));

create policy "members read fields" on fields for select
  using (org_id in (select public.user_org_ids()));

create policy "members manage fields" on fields for all
  using (org_id in (select public.user_org_ids()));

create policy "members read zones" on zones for select
  using (field_id in (select id from fields where org_id in (select public.user_org_ids())));

create policy "members manage zones" on zones for all
  using (field_id in (select id from fields where org_id in (select public.user_org_ids())));

create policy "members read observations" on observations for select
  using (field_id in (select id from fields where org_id in (select public.user_org_ids())));

create policy "members insert observations" on observations for insert
  with check (field_id in (select id from fields where org_id in (select public.user_org_ids())));

create policy "members update observations" on observations for update
  using (field_id in (select id from fields where org_id in (select public.user_org_ids())));

create policy "members read satellite" on satellite_readings for select
  using (zone_id in (
    select z.id from zones z
    join fields f on f.id = z.field_id
    where f.org_id in (select public.user_org_ids())
  ));

create policy "members read weather" on weather_readings for select
  using (field_id in (select id from fields where org_id in (select public.user_org_ids())));

create policy "members read alerts" on alerts for select
  using (field_id in (select id from fields where org_id in (select public.user_org_ids())));

create policy "members update alerts" on alerts for update
  using (field_id in (select id from fields where org_id in (select public.user_org_ids())));

create policy "members manage alert settings" on alert_settings for all
  using (org_id in (select public.user_org_ids()));

create policy "users manage own push subs" on push_subscriptions for all
  using (user_id = auth.uid());

-- Storage bucket (run via Supabase dashboard or storage API)
-- insert into storage.buckets (id, name, public) values ('observations', 'observations', false);
