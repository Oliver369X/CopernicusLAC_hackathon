/**
 * Ejecuta job cron contra la app local (requiere pnpm dev).
 * Uso: node scripts/cron-once.mjs [job]
 * job: weather | satellite | fires | climate | alerts | science-batch | all
 */
import { loadEnv } from './load-env.mjs';

loadEnv();

const job = process.argv[2] ?? 'all';
const base = process.env.APP_URL ?? 'http://localhost:3000';
const secret = process.env.CRON_SECRET ?? process.env.WORKER_SECRET ?? '';

const url = `${base}/api/cron/fetch-metrics?job=${job}`;
const headers = secret ? { Authorization: `Bearer ${secret}` } : {};

console.log(`POST ${url}`);
const res = await fetch(url, { headers });
const text = await res.text();
console.log('Status:', res.status);
console.log(text.slice(0, 2000));
process.exit(res.ok ? 0 : 1);
