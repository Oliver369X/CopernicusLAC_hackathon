#!/usr/bin/env node
/**
 * Migra DB dev con field-1/zone-1-* → San Julián (field-sj-*, zone-sj-*).
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
  const start = sql.indexOf(marker);
  if (start < 0) return null;
  const end = sql.indexOf(';', start);
  if (table === 'alerts') {
    const last = sql.lastIndexOf(';');
    return sql.slice(start, last + 1);
  }
  return sql.slice(start, end + 1);
}

function upsertSuffix(table) {
  if (table === 'fields') {
    return ` ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, crop_type = EXCLUDED.crop_type, area_ha = EXCLUDED.area_ha,
      center_lat = EXCLUDED.center_lat, center_lng = EXCLUDED.center_lng,
      bounds = EXCLUDED.bounds, location_label = EXCLUDED.location_label,
      planting_date = EXCLUDED.planting_date, days_from_planting = EXCLUDED.days_from_planting,
      overall_health = EXCLUDED.overall_health, risk_score = EXCLUDED.risk_score,
      notifications = EXCLUDED.notifications`;
  }
  if (table === 'zones') {
    return ` ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, area_ha = EXCLUDED.area_ha, bounds = EXCLUDED.bounds,
      health = EXCLUDED.health, ndvi_average = EXCLUDED.ndvi_average,
      ndmi_average = EXCLUDED.ndmi_average, temperature_average = EXCLUDED.temperature_average,
      soil_moisture_average = EXCLUDED.soil_moisture_average,
      observation_count = EXCLUDED.observation_count, disease_risks = EXCLUDED.disease_risks`;
  }
  if (table === 'alerts') {
    return '';
  }
  return '';
}

const client = new pg.Client({ connectionString: url });
await client.connect();

const oldFieldIds = ['field-1', 'field-2', 'field-3', 'field-4', 'field-5', 'field-6'];

console.log('Eliminando datos demo antiguos (Pampas)...');
await client.query('DELETE FROM alerts WHERE field_id = ANY($1::text[])', [oldFieldIds]);
await client.query(
  `DELETE FROM satellite_readings WHERE zone_id IN (
    SELECT id FROM zones WHERE field_id = ANY($1::text[])
  )`,
  [oldFieldIds]
);
await client.query(
  'DELETE FROM climate_readings WHERE field_id = ANY($1::text[])',
  [oldFieldIds]
);
await client.query('DELETE FROM zones WHERE field_id = ANY($1::text[])', [oldFieldIds]);
await client.query('DELETE FROM fields WHERE id = ANY($1::text[])', [oldFieldIds]);

const seed02 = readFileSync(join(initDir, '02-seed.sql'), 'utf8');
const sjBlock = seed02.split('-- SJ_SEED_START')[1];
if (!sjBlock) {
  console.error('Marcador -- SJ_SEED_START no encontrado en 02-seed.sql');
  process.exit(1);
}

for (const table of ['fields', 'zones', 'alerts']) {
  const stmt = extractInsert(sjBlock, table);
  if (!stmt) {
    console.error(`INSERT INTO ${table} no encontrado`);
    process.exit(1);
  }
  console.log(`Aplicando ${table}...`);
  if (table === 'alerts') {
    await client.query(
      `DELETE FROM alerts WHERE dedup_key IN ('seed-alert-1','seed-alert-2','seed-alert-3')`
    );
  }
  const sql = stmt.replace(/;\s*$/, '') + upsertSuffix(table);
  await client.query(sql);
}

console.log('Aplicando satellite_readings + climate_readings...');
const seed05 = readFileSync(join(initDir, '05-seed-satellite-climate.sql'), 'utf8');
await client.query(seed05);

const geodataSql = readFileSync(join(initDir, '09-geodata-links.sql'), 'utf8');
for (const sql of geodataSql.split(';').map((s) => s.trim()).filter(Boolean)) {
  await client.query(`${sql};`);
}

const { rows: zoneCount } = await client.query(
  'SELECT count(*)::int AS n FROM zones WHERE id LIKE \'zone-sj-%\''
);
const { rows: readingCount } = await client.query(
  'SELECT count(*)::int AS n FROM satellite_readings WHERE zone_id LIKE \'zone-sj-%\''
);

console.log(`Zonas zone-sj-*: ${zoneCount[0].n}`);
console.log(`Lecturas satellite_readings zone-sj-*: ${readingCount[0].n}`);

await client.end();
process.exit(zoneCount[0].n >= 11 && readingCount[0].n >= 35 ? 0 : 1);
