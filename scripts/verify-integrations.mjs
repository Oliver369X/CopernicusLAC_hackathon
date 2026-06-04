/**
 * Verifica integraciones configuradas en .env (sin imprimir secretos).
 * Uso: node scripts/verify-integrations.mjs
 */
import { loadEnv } from './load-env.mjs';

if (!loadEnv()) {
  console.error('No .env — copia .env.local.example a .env');
  process.exit(1);
}

const checks = [];

async function check(name, fn) {
  try {
    const ok = await fn();
    checks.push({ name, ok });
    console.log(ok ? `✓ ${name}` : `✗ ${name}`);
  } catch (e) {
    checks.push({ name, ok: false });
    console.log(`✗ ${name}:`, e.message);
  }
}

await check('Copernicus CDSE token', async () => {
  const id = process.env.COPERNICUS_CLIENT_ID;
  const secret = process.env.COPERNICUS_CLIENT_SECRET;
  if (!id || !secret) return false;
  const res = await fetch(
    'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: id,
        client_secret: secret,
      }),
    }
  );
  return res.ok;
});

await check('NASA FIRMS key set', async () =>
  Boolean(process.env.NASA_FIRMS_MAP_KEY?.length > 8)
);

await check('Mistral key set', async () =>
  Boolean(process.env.MISTRAL_API_KEY?.length > 8)
);

await check('Postgres (localhost:5433)', async () => {
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query('SELECT 1');
    return true;
  } finally {
    await pool.end();
  }
});

await check('MinIO (localhost:9000)', async () => {
  const endpoint = process.env.MINIO_ENDPOINT ?? 'http://localhost:9000';
  const res = await fetch(`${endpoint}/minio/health/live`);
  return res.ok;
});

await check('Copernicus process grid (S2)', async () => {
  const id = process.env.COPERNICUS_CLIENT_ID;
  const secret = process.env.COPERNICUS_CLIENT_SECRET;
  if (!id || !secret) return false;

  const tokenRes = await fetch(
    'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: id,
        client_secret: secret,
      }),
    }
  );
  if (!tokenRes.ok) return false;
  const { access_token: token } = await tokenRes.json();

  const bbox = [-62.31, -34.91, -62.29, -34.89];
  const to = new Date().toISOString();
  const from = new Date(Date.now() - 30 * 86400000).toISOString();
  const body = {
    input: {
      bounds: { bbox, properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' } },
      data: [
        {
          type: 'sentinel-2-l2a',
          dataFilter: { timeRange: { from, to }, maxCloudCoverage: 40, mosaickingOrder: 'leastCC' },
        },
      ],
    },
    output: {
      width: 32,
      height: 32,
      responses: [{ identifier: 'default', format: { type: 'image/tiff' } }],
    },
    evalscript: `//VERSION=3
function setup(){return{input:[{bands:["B04","B08","B11"],units:"REFLECTANCE"}],output:[{id:"default",bands:2,sampleType:"FLOAT32"}]}}
function evaluatePixel(s){let ndvi=(s.B08-s.B04)/(s.B08+s.B04);let ndmi=(s.B08-s.B11)/(s.B08+s.B11);return[ndvi,ndmi]}`,
  };

  const res = await fetch('https://sh.dataspace.copernicus.eu/api/v1/process', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) return false;
  const ct = res.headers.get('content-type') ?? '';
  return ct.includes('tiff') || ct.includes('octet-stream');
});

await check('Copernicus tile API (local dev)', async () => {
  const id = process.env.COPERNICUS_CLIENT_ID;
  const secret = process.env.COPERNICUS_CLIENT_SECRET;
  if (!id || !secret) return false;

  const base = process.env.APP_URL ?? 'http://localhost:3000';
  const bbox = '-62.31,-34.91,-62.29,-34.89';
  try {
    const res = await fetch(`${base}/api/satellite/tiles?layer=ndvi&bbox=${bbox}&width=64&height=64`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 503) return false;
    if (!res.ok) return false;
    return (res.headers.get('content-type') ?? '').includes('image/png');
  } catch {
    return false;
  }
});

const failed = checks.filter((c) => !c.ok).length;
console.log(failed ? `\n${failed} check(s) failed.` : '\nAll checks passed.');
process.exit(failed ? 1 : 0);
