#!/usr/bin/env node
const secret = process.env.CRON_SECRET ?? process.env.WORKER_SECRET;
const base = process.env.APP_URL ?? 'http://web:3000';
const job = process.argv[2] ?? 'satellite';
const extra = process.argv[3] ? `&days=${process.argv[3]}` : '';
const url = `${base}/api/cron/fetch-metrics?job=${job}${extra}`;

fetch(url, { headers: { Authorization: `Bearer ${secret}` } })
  .then((r) => r.text())
  .then((t) => {
    console.log(t.slice(0, 800));
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
