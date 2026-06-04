/**
 * Cron runner for VPS — calls Next.js /api/cron/fetch-metrics on schedule.
 * Satellite every 6h; weather/fires/climate daily; backfill weekly; alerts after satellite.
 */
const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';
const SECRET = process.env.CRON_SECRET ?? process.env.WORKER_SECRET ?? '';

const SATELLITE_MS = 6 * 60 * 60 * 1000;
const DAILY_MS = 24 * 60 * 60 * 1000;
const WEEKLY_MS = 7 * 24 * 60 * 60 * 1000;
const BACKFILL_DAYS = process.env.SATELLITE_BACKFILL_DAYS ?? '90';

async function runJob(job) {
  const url =
    job === 'satellite-backfill'
      ? `${APP_URL}/api/cron/fetch-metrics?job=satellite-backfill&days=${BACKFILL_DAYS}`
      : `${APP_URL}/api/cron/fetch-metrics?job=${job}`;
  const headers = SECRET ? { Authorization: `Bearer ${SECRET}` } : {};
  const res = await fetch(url, { headers });
  const body = await res.text();
  console.log(`[${new Date().toISOString()}] job=${job} status=${res.status}`, body.slice(0, 200));
  if (!res.ok) throw new Error(`Job ${job} failed: ${res.status}`);
}

async function tickSatellite() {
  await runJob('satellite');
  await runJob('narrative-batch');
  await runJob('alerts');
}

async function tickDaily() {
  await runJob('weather');
  await runJob('fires');
  await runJob('climate');
  await runJob('science-batch');
  await runJob('narrative-batch');
  await runJob('alerts');
}

async function tickWeeklyBackfill() {
  await runJob('satellite-backfill');
}

console.log('Aura Agro worker started', { APP_URL });

tickSatellite().catch((e) => console.error('initial satellite', e));
tickDaily().catch((e) => console.error('initial daily', e));
tickWeeklyBackfill().catch((e) => console.error('initial backfill', e));

setInterval(() => tickSatellite().catch(console.error), SATELLITE_MS);
setInterval(() => tickDaily().catch(console.error), DAILY_MS);
setInterval(() => tickWeeklyBackfill().catch(console.error), WEEKLY_MS);
