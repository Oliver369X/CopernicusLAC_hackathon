-- Real data loop: NDRE, alert dedup, user contact for WhatsApp

alter table satellite_readings add column if not exists ndre numeric;

alter table alerts add column if not exists dedup_key text;

create unique index if not exists idx_alerts_dedup_key
  on alerts (dedup_key)
  where dedup_key is not null;

create table if not exists user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  whatsapp_opt_in boolean default false,
  updated_at timestamptz not null default now()
);

alter table user_profiles enable row level security;

create policy "users manage own profile" on user_profiles
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
