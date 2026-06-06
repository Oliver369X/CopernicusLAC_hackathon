#!/usr/bin/env node
/**
 * Inserta/actualiza demo pequeña agricultora (maria@doctorsoya.app, field-pf-*, zone-pf-*).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { loadEnv } from './load-env.mjs';

loadEnv();

const root = dirname(fileURLToPath(import.meta.url));
const initDir = join(root, '..', 'docker', 'postgres', 'init');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL no configurada');
  process.exit(1);
}

function extractInsert(sql, table) {
  const marker = `INSERT INTO ${table}`;
  const parts = sql.split(marker).slice(1);
  if (parts.length === 0) return null;
  const last = parts[parts.length - 1];
  const end = last.indexOf(';');
  return marker + last.slice(0, end + 1);
}

function upsertSuffix(table) {
  if (table === 'users') {
    return ` ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`;
  }
  if (table === 'organizations') {
    return ` ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`;
  }
  if (table === 'organization_members') {
    return ` ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role`;
  }
  if (table === 'fields') {
    return ` ON CONFLICT (id) DO UPDATE SET
      org_id = EXCLUDED.org_id, name = EXCLUDED.name, crop_type = EXCLUDED.crop_type, area_ha = EXCLUDED.area_ha,
      center_lat = EXCLUDED.center_lat, center_lng = EXCLUDED.center_lng,
      bounds = EXCLUDED.bounds, location_label = EXCLUDED.location_label,
      planting_date = EXCLUDED.planting_date, days_from_planting = EXCLUDED.days_from_planting,
      overall_health = EXCLUDED.overall_health, risk_score = EXCLUDED.risk_score,
      notifications = EXCLUDED.notifications`;
  }
  if (table === 'zones') {
    return ` ON CONFLICT (id) DO UPDATE SET
      field_id = EXCLUDED.field_id, name = EXCLUDED.name, area_ha = EXCLUDED.area_ha, bounds = EXCLUDED.bounds,
      health = EXCLUDED.health, ndvi_average = EXCLUDED.ndvi_average,
      ndmi_average = EXCLUDED.ndmi_average, temperature_average = EXCLUDED.temperature_average,
      soil_moisture_average = EXCLUDED.soil_moisture_average,
      observation_count = EXCLUDED.observation_count, disease_risks = EXCLUDED.disease_risks`;
  }
  return '';
}

const client = new pg.Client({ connectionString: url });
await client.connect();

const seed02 = readFileSync(join(initDir, '02-seed.sql'), 'utf8');
const pfBlock = seed02.split('-- PF_SEED_START')[1];
if (!pfBlock) {
  console.error('Marcador -- PF_SEED_START no encontrado en 02-seed.sql');
  process.exit(1);
}

const userStmt = `INSERT INTO users (id, email, password_hash) VALUES
  ('b0000000-0000-4000-8000-000000000004', 'maria@doctorsoya.app', '$2b$10$nVUhz4SVqlzWu4ZQPyhYvekSa69AFVC/cILAQP/nFaMVgU/vrdogy')`;
const orgStmt = `INSERT INTO organizations (id, name) VALUES
  ('a0000000-0000-4000-8000-000000000002', 'Finca María — San Julián')`;
const memberStmt = `INSERT INTO organization_members (org_id, user_id, role) VALUES
  ('a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000004', 'owner')`;

for (const [label, stmt, table] of [
  ['usuario maria@doctorsoya.app', userStmt, 'users'],
  ['organización Finca María', orgStmt, 'organizations'],
  ['membresía owner', memberStmt, 'organization_members'],
]) {
  console.log(`Aplicando ${label}...`);
  await client.query(stmt + upsertSuffix(table));
}

for (const table of ['fields', 'zones', 'alerts']) {
  const stmt = extractInsert(pfBlock, table);
  if (!stmt) {
    console.error(`INSERT INTO ${table} no encontrado en bloque PF`);
    process.exit(1);
  }
  console.log(`Aplicando ${table} (pequeña agricultora)...`);
  if (table === 'alerts') {
    await client.query(
      `DELETE FROM alerts WHERE dedup_key IN ('seed-alert-pf-1', 'seed-alert-pf-2')`
    );
    await client.query(stmt);
    continue;
  }
  const sql = stmt.replace(/;\s*$/, '') + upsertSuffix(table);
  await client.query(sql);
}

console.log('Aplicando satellite_readings + climate (zone-pf-*)...');
const seed05 = readFileSync(join(initDir, '05-seed-satellite-climate.sql'), 'utf8');
const pfSatelliteBlock = seed05.split('-- PF_SATELLITE_START')[1];
if (pfSatelliteBlock) {
  await client.query(pfSatelliteBlock.trim());
}
await client.query(`
  INSERT INTO climate_readings (field_id, soil_moisture_anomaly, temp_anomaly, drought_index, viability_score, projection_year, captured_at) VALUES
  ('field-pf-soja', -0.03, 0.15, 0.28, 76, 2030, now() - interval '1 day'),
  ('field-pf-maiz', 0.04, -0.05, 0.12, 88, 2030, now() - interval '1 day'),
  ('field-pf-trigo', -0.09, 0.25, 0.42, 64, 2030, now() - interval '1 day')
  ON CONFLICT DO NOTHING
`);

console.log('Aplicando billing (06-billing-plans.sql)...');
const billingSql = readFileSync(join(initDir, '06-billing-plans.sql'), 'utf8');
await client.query(billingSql);

const { rows: fieldCount } = await client.query(
  `SELECT count(*)::int AS n FROM fields WHERE id LIKE 'field-pf-%'`
);
const { rows: zoneCount } = await client.query(
  `SELECT count(*)::int AS n FROM zones WHERE id LIKE 'zone-pf-%'`
);
const { rows: billing } = await client.query(
  `SELECT billing_model, plan_tier, hectare_limit::int AS hectare_limit, max_zone_split
   FROM organizations WHERE id = 'a0000000-0000-4000-8000-000000000002'`
);

console.log(`Campos field-pf-*: ${fieldCount[0].n}`);
console.log(`Zonas zone-pf-*: ${zoneCount[0].n}`);
console.log('Billing Finca María:', billing[0] ?? '—');

await client.end();
process.exit(
  fieldCount[0].n >= 3 &&
    zoneCount[0].n >= 3 &&
    billing[0]?.billing_model === 'hectare'
    ? 0
    : 1
);
