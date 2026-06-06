#!/usr/bin/env node
/**
 * Verifica cobertura satellite_readings para zonas zone-sj-* (demo San Julián).
 */
import pg from 'pg';
import { loadEnv } from './load-env.mjs';

loadEnv();

const SCIENCE_ZONES = [
  'zone-sj-n-1', 'zone-sj-n-2', 'zone-sj-n-3', 'zone-sj-n-4',
  'zone-sj-n-5', 'zone-sj-n-6', 'zone-sj-e-1', 'zone-sj-e-2',
  'zone-sj-w-1', 'zone-sj-s-1', 'zone-sj-s-2',
];

const SCIENCE_CROP_ZONES = new Set([
  'zone-sj-n-1', 'zone-sj-n-2', 'zone-sj-n-3', 'zone-sj-n-4',
  'zone-sj-n-5', 'zone-sj-n-6', 'zone-sj-e-1', 'zone-sj-e-2',
  'zone-sj-w-1', 'zone-sj-s-1', 'zone-sj-s-2',
]);

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL no configurada');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

const { rows } = await client.query(`
  SELECT zone_id,
         MAX(reading_date)::text AS last_reading,
         MAX(source) AS source,
         (CURRENT_DATE - MAX(reading_date))::int AS gap_days
  FROM satellite_readings
  WHERE zone_id = ANY($1::text[])
  GROUP BY zone_id
`, [SCIENCE_ZONES]);

const byZone = new Map(rows.map((r) => [r.zone_id, r]));
let failed = false;

console.log('zone_id          | last_reading | source     | gap_days');
console.log('-----------------|--------------|------------|----------');

for (const zoneId of SCIENCE_ZONES) {
  const row = byZone.get(zoneId);
  if (!row) {
    console.log(`${zoneId.padEnd(16)} | —            | —          | —`);
    if (SCIENCE_CROP_ZONES.has(zoneId)) failed = true;
    continue;
  }
  const gap = row.gap_days ?? 999;
  console.log(
    `${zoneId.padEnd(16)} | ${String(row.last_reading).padEnd(12)} | ${String(row.source ?? '—').padEnd(10)} | ${gap}`
  );
  if (SCIENCE_CROP_ZONES.has(zoneId) && gap > 14) {
    failed = true;
  }
}

await client.end();
process.exit(failed ? 1 : 0);
