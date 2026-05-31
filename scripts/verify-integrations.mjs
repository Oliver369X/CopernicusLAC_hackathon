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

const failed = checks.filter((c) => !c.ok).length;
console.log(failed ? `\n${failed} check(s) failed.` : '\nAll checks passed.');
process.exit(failed ? 1 : 0);
