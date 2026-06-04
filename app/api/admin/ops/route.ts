import { NextResponse } from 'next/server';
import { canAccessAdminOps } from '@/lib/auth/admin-ops';
import { dbQuery } from '@/lib/db/pool';
import { isDatabaseConfigured } from '@/lib/db/config';

export async function GET() {
  if (!(await canAccessAdminOps())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ cronRuns: [], importJobs: [], pipeline: null });
  }

  const cronRuns = await dbQuery<{
    job_name: string;
    status: string;
    finished_at: string;
  }>(
    `SELECT job_name, status, finished_at::text FROM cron_runs
     ORDER BY finished_at DESC LIMIT 30`
  );

  const importJobs = await dbQuery<{
    org_id: string;
    status: string;
    zones_done: number;
    zones_total: number;
    updated_at: string;
  }>(
    `SELECT org_id::text, status, zones_done, zones_total, updated_at::text
     FROM import_jobs ORDER BY created_at DESC LIMIT 20`
  );

  const pipeline = await dbQuery<{ label: string; value: string }>(
    `SELECT 'zones_total' AS label, COUNT(z.id)::text AS value FROM zones z
     UNION ALL
     SELECT 'zones_satellite', COUNT(DISTINCT sr.zone_id)::text FROM satellite_readings sr
     UNION ALL
     SELECT 'insights', COUNT(*)::text FROM zone_insights`
  );

  const pipelineMap = Object.fromEntries(pipeline.map((p) => [p.label, p.value]));

  return NextResponse.json({
    cronRuns,
    importJobs,
    pipeline: pipelineMap,
    satelliteDelayMs: process.env.SATELLITE_ZONE_DELAY_MS ?? '2000',
  });
}
