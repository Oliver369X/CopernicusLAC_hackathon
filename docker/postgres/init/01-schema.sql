-- Doctor Soya — Postgres standalone (sin Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE organization_members (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

CREATE TABLE fields (
  id TEXT PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  crop_type TEXT NOT NULL,
  area_ha NUMERIC NOT NULL,
  center_lat NUMERIC NOT NULL,
  center_lng NUMERIC NOT NULL,
  bounds JSONB NOT NULL,
  location_label TEXT,
  planting_date DATE,
  days_from_planting INTEGER DEFAULT 0,
  overall_health TEXT NOT NULL DEFAULT 'good',
  risk_score INTEGER DEFAULT 0,
  notifications INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE zones (
  id TEXT PRIMARY KEY,
  field_id TEXT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area_ha NUMERIC NOT NULL,
  bounds JSONB NOT NULL,
  health TEXT NOT NULL DEFAULT 'good',
  ndvi_average NUMERIC NOT NULL DEFAULT 0,
  ndmi_average NUMERIC NOT NULL DEFAULT 0,
  temperature_average NUMERIC NOT NULL DEFAULT 0,
  soil_moisture_average NUMERIC NOT NULL DEFAULT 0,
  observation_count INTEGER DEFAULT 0,
  disease_risks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE observations (
  id TEXT PRIMARY KEY,
  field_id TEXT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  zone_id TEXT REFERENCES zones(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  lat NUMERIC,
  lng NUMERIC,
  image_path TEXT,
  image_url TEXT,
  vision_result JSONB,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE satellite_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id TEXT NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ndvi NUMERIC NOT NULL,
  ndmi NUMERIC NOT NULL,
  ndre NUMERIC,
  source TEXT NOT NULL DEFAULT 'sentinel',
  raw_metadata JSONB DEFAULT '{}'::jsonb,
  s1_vh NUMERIC,
  s1_vv NUMERIC,
  s1_moisture_index NUMERIC,
  s3_lst NUMERIC,
  cloud_cover NUMERIC,
  ndvi_grid JSONB,
  scene_date TIMESTAMPTZ,
  reading_date DATE DEFAULT (CURRENT_DATE),
  science_metadata JSONB
);

CREATE UNIQUE INDEX idx_satellite_zone_day ON satellite_readings (zone_id, reading_date);
CREATE INDEX idx_satellite_zone_captured ON satellite_readings (zone_id, captured_at DESC);

CREATE TABLE weather_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id TEXT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  temp NUMERIC,
  humidity NUMERIC,
  precipitation NUMERIC,
  wind NUMERIC,
  raw_metadata JSONB DEFAULT '{}'::jsonb,
  soil_moisture NUMERIC,
  et0 NUMERIC
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id TEXT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  zone_id TEXT REFERENCES zones(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  metrics JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT false,
  dedup_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_alerts_dedup_key ON alerts (dedup_key) WHERE dedup_key IS NOT NULL;

CREATE TABLE alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (org_id, user_id)
);

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT,
  whatsapp_opt_in BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fire_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id TEXT REFERENCES fields(id) ON DELETE CASCADE,
  detected_at TIMESTAMPTZ NOT NULL,
  lat NUMERIC,
  lng NUMERIC,
  confidence NUMERIC,
  satellite TEXT,
  source TEXT DEFAULT 'nasa_firms',
  raw_metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_fire_field_detected ON fire_detections (field_id, detected_at DESC);

CREATE TABLE climate_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id TEXT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  soil_moisture_anomaly NUMERIC,
  temp_anomaly NUMERIC,
  drought_index NUMERIC,
  viability_score NUMERIC,
  projection_year INTEGER,
  raw_metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_climate_field_captured ON climate_readings (field_id, captured_at DESC);

CREATE TABLE science_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop TEXT NOT NULL,
  field_id TEXT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  zone_id TEXT REFERENCES zones(id) ON DELETE SET NULL,
  hypothesis TEXT NOT NULL DEFAULT '',
  notes TEXT,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE science_timeseries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id TEXT NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  field_id TEXT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  crop TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  optical JSONB NOT NULL DEFAULT '{}',
  radar JSONB NOT NULL DEFAULT '{}',
  lst NUMERIC,
  algorithm_version TEXT NOT NULL DEFAULT '1.0.0',
  fusion_score_rules NUMERIC,
  fusion_score_ml NUMERIC,
  health_label_rules TEXT,
  health_label_ml TEXT,
  anomaly_flags JSONB DEFAULT '[]'
);

CREATE TABLE science_validation_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_id UUID,
  field_id TEXT REFERENCES fields(id) ON DELETE CASCADE,
  zone_id TEXT REFERENCES zones(id) ON DELETE SET NULL,
  crop TEXT NOT NULL,
  disease_label TEXT,
  severity TEXT CHECK (severity IN ('none', 'low', 'medium', 'high', 'critical')),
  health_label TEXT CHECK (health_label IN ('excellent', 'good', 'warning', 'critical')),
  lat NUMERIC,
  lng NUMERIC,
  validated_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE science_validation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop TEXT NOT NULL,
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  algorithm_version TEXT NOT NULL DEFAULT '1.0.0',
  model_version TEXT NOT NULL DEFAULT '1.0.0',
  sample_count INTEGER NOT NULL DEFAULT 0,
  metrics JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_science_experiments_crop ON science_experiments (crop, created_at DESC);
CREATE INDEX idx_science_ts_zone_time ON science_timeseries (zone_id, captured_at DESC);
