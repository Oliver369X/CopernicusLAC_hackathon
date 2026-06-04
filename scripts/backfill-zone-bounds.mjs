/**
 * Backfill zones.bounds from parent field polygon when empty.
 * Usage: node scripts/backfill-zone-bounds.mjs
 */
import pg from 'pg';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('..', import.meta.url)));

function loadEnv() {
  for (const f of ['.env.local', '.env']) {
    const p = join(root, f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m && !process.env[m[1].trim()]) {
        process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
}

function isEmptyBounds(b) {
  if (!b || typeof b !== 'object') return true;
  if (Object.keys(b).length === 0) return true;
  if (b.type === 'Polygon' && Array.isArray(b.coordinates?.[0])) {
    return b.coordinates[0].length < 4;
  }
  return false;
}

function normalizeFieldBounds(raw, center) {
  if (raw?.type === 'Polygon' && raw.coordinates?.[0]?.length >= 4) {
    const ring = raw.coordinates[0];
    const lngs = ring.map((c) => c[0]);
    const lats = ring.map((c) => c[1]);
    return [
      { lat: Math.max(...lats), lng: Math.min(...lngs) },
      { lat: Math.max(...lats), lng: Math.max(...lngs) },
      { lat: Math.min(...lats), lng: Math.max(...lngs) },
      { lat: Math.min(...lats), lng: Math.min(...lngs) },
    ];
  }
  const half = 0.01;
  return [
    { lat: center.lat + half, lng: center.lng - half },
    { lat: center.lat + half, lng: center.lng + half },
    { lat: center.lat - half, lng: center.lng + half },
    { lat: center.lat - half, lng: center.lng - half },
  ];
}

function generateZoneBounds(fieldBounds, index, total) {
  const [nw, ne, se, sw] = fieldBounds;
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;
  const rows = Math.ceil(total / cols);
  const latSpan = (nw.lat - sw.lat) / rows;
  const lngSpan = (ne.lng - nw.lng) / cols;
  const zoneNwLat = nw.lat - row * latSpan;
  const zoneNwLng = nw.lng + col * lngSpan;
  const zoneSeLat = zoneNwLat - latSpan;
  const zoneSeLng = zoneNwLng + lngSpan;
  return [
    { lat: zoneNwLat, lng: zoneNwLng },
    { lat: zoneNwLat, lng: zoneSeLng },
    { lat: zoneSeLat, lng: zoneSeLng },
    { lat: zoneSeLat, lng: zoneNwLng },
  ];
}

function toPolygonJson(bounds) {
  const ring = [...bounds.map((p) => [p.lng, p.lat]), [bounds[0].lng, bounds[0].lat]];
  return JSON.stringify({ type: 'Polygon', coordinates: [ring] });
}

loadEnv();
const url =
  process.env.DATABASE_URL ??
  'postgresql://doctorsoya:doctorsoya@localhost:5433/doctorsoya';

const client = new pg.Client({ connectionString: url });
await client.connect();

const { rows: fields } = await client.query(
  'SELECT id, bounds, center_lat, center_lng FROM fields'
);

let updated = 0;
for (const field of fields) {
  const center = { lat: Number(field.center_lat), lng: Number(field.center_lng) };
  const fieldBounds = normalizeFieldBounds(field.bounds, center);
  const { rows: zones } = await client.query(
    'SELECT id, bounds FROM zones WHERE field_id = $1 ORDER BY id',
    [field.id]
  );
  const total = zones.length;
  for (let index = 0; index < zones.length; index++) {
    const zone = zones[index];
    if (!isEmptyBounds(zone.bounds)) continue;
    const zb = generateZoneBounds(fieldBounds, index, total);
    const json = toPolygonJson(zb);
    await client.query('UPDATE zones SET bounds = $1::jsonb WHERE id = $2', [json, zone.id]);
    updated += 1;
  }
}

await client.end();
console.log(`Backfill zone bounds: ${updated} zonas actualizadas`);
