/**
 * Backfill histórico Copernicus CDSE (90 días por defecto).
 * Requiere pnpm dev en otra terminal.
 * Uso: node scripts/backfill-satellite.mjs [days]
 */
import { loadEnv } from './load-env.mjs';

loadEnv();

const days = parseInt(process.argv[2] ?? '90', 10);
const base = process.env.APP_URL ?? 'http://localhost:3000';
const secret = process.env.CRON_SECRET ?? process.env.WORKER_SECRET ?? '';

const url = `${base}/api/cron/fetch-metrics?job=satellite-backfill&days=${days}`;
const headers = secret ? { Authorization: `Bearer ${secret}` } : {};

console.log(`GET ${url}`);
const res = await fetch(url, { headers });
const text = await res.text();
console.log('Status:', res.status);
console.log(text.slice(0, 3000));
process.exit(res.ok ? 0 : 1);
