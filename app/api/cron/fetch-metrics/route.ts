import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isDatabaseConfigured } from '@/lib/db/config';
import { getFields } from '@/lib/data/fields';
import {
  runAlertsJob,
  runClimateJob,
  runFiresJob,
  runSatelliteBackfillJob,
  runSatelliteJob,
  runWeatherJob,
} from '@/lib/cron/jobs';
import { runScienceBatchJob } from '@/lib/cron/science-batch';
import { runNarrativeBatch } from '@/lib/cron/narrative-batch';
import { dbQuery } from '@/lib/db/pool';

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET ?? process.env.WORKER_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const job = searchParams.get('job') ?? 'all';
  const results: Record<string, unknown> = {};

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ message: 'Database not configured', job });
  }

  const service = await createServiceClient();
  const orgId = searchParams.get('orgId') ?? undefined;
  const fields = await getFields(orgId);

  if (job === 'onboarding' && orgId) {
    const { markImportJobRunning, getActiveImportJobForOrg } = await import(
      '@/lib/import-jobs/active-job'
    );
    const active = await getActiveImportJobForOrg(orgId);
    if (active) await markImportJobRunning(active.id);
    results.satellite = await runSatelliteJob(service, fields);
    results.narrativeBatch = await runNarrativeBatch(service, fields);
    results.alerts = await runAlertsJob(service, fields);
    await dbQuery(`INSERT INTO cron_runs (job_name, status) VALUES ($1, 'ok')`, [
      'onboarding',
    ]);
    return NextResponse.json({ ok: true, job: 'onboarding', orgId, results });
  }

  if (job === 'weather' || job === 'all') {
    results.weather = await runWeatherJob(service, fields);
  }

  if (job === 'satellite' || job === 'all') {
    results.satellite = await runSatelliteJob(service, fields);
  }

  if (job === 'satellite-backfill') {
    const days = Math.min(
      365,
      Math.max(7, parseInt(searchParams.get('days') ?? '90', 10))
    );
    results.satelliteBackfill = await runSatelliteBackfillJob(service, fields, days);
  }

  if (job === 'fires' || job === 'all') {
    results.fires = await runFiresJob(service, fields);
  }

  if (job === 'climate' || job === 'all') {
    results.climate = await runClimateJob(service, fields);
  }

  if (job === 'alerts' || job === 'all') {
    results.alerts = await runAlertsJob(service, fields);
  }

  if (job === 'science-batch' || job === 'all') {
    results.scienceBatch = await runScienceBatchJob(service, fields);
  }

  if (job === 'narrative-batch' || job === 'all') {
    results.narrativeBatch = await runNarrativeBatch(service, fields);
    await dbQuery(
      `INSERT INTO cron_runs (job_name, status) VALUES ($1, 'ok')`,
      ['narrative-batch']
    );
  }

  return NextResponse.json({ ok: true, job, results });
}
