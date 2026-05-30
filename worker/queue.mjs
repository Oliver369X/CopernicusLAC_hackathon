/**
 * BullMQ job queue — satellite, climate, fires, notifications (alerts).
 */
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';
const SECRET = process.env.CRON_SECRET ?? process.env.WORKER_SECRET ?? '';
const REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

async function callCron(jobName) {
  const url = `${APP_URL}/api/cron/fetch-metrics?job=${jobName}`;
  const headers = SECRET ? { Authorization: `Bearer ${SECRET}` } : {};
  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Cron ${jobName} failed: ${res.status}`);
  return data;
}

const queue = new Queue('doctor-soya', { connection });

const worker = new Worker(
  'doctor-soya',
  async (job) => {
    const name = job.name === 'notifications' ? 'alerts' : job.name;
    return callCron(name);
  },
  { connection, concurrency: 1 }
);

worker.on('completed', (job) => console.log(`[queue] done ${job.name}`));
worker.on('failed', (job, err) => console.error(`[queue] failed ${job?.name}`, err));

async function scheduleRepeatables() {
  await queue.add('satellite', {}, { repeat: { every: 6 * 60 * 60 * 1000 } });
  await queue.add('weather', {}, { repeat: { every: 24 * 60 * 60 * 1000 } });
  await queue.add('fires', {}, { repeat: { every: 24 * 60 * 60 * 1000 } });
  await queue.add('climate', {}, { repeat: { every: 24 * 60 * 60 * 1000 } });
  await queue.add('notifications', {}, { repeat: { every: 6 * 60 * 60 * 1000 } });
  console.log('BullMQ repeatables registered');
}

scheduleRepeatables().catch(console.error);
console.log('Doctor Soya queue worker listening');
