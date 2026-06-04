import { NextResponse } from 'next/server';
import { dbQueryOne } from '@/lib/db/pool';
import { getSessionOrg } from '@/lib/auth/org';

export async function GET() {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ job: null });

  const job = await dbQueryOne<{
    id: string;
    status: string;
    zones_done: number;
    zones_total: number;
    error: string | null;
    updated_at: string;
  }>(
    `SELECT id, status, zones_done, zones_total, error, updated_at::text
     FROM import_jobs WHERE org_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [org.orgId]
  );

  if (!job) return NextResponse.json({ job: null });

  const pct =
    job.zones_total > 0
      ? Math.round((job.zones_done / job.zones_total) * 100)
      : 0;

  return NextResponse.json({
    job: {
      id: job.id,
      status: job.status,
      zonesDone: job.zones_done,
      zonesTotal: job.zones_total,
      percent: pct,
      error: job.error,
      updatedAt: job.updated_at,
    },
  });
}
