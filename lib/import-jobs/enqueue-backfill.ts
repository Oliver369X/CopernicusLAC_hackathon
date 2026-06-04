import { dbQueryOne } from '@/lib/db/pool';
import { isDatabaseConfigured } from '@/lib/db/config';

export async function createImportJob(
  orgId: string,
  zonesTotal: number
): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;
  const row = await dbQueryOne<{ id: string }>(
    `INSERT INTO import_jobs (org_id, status, zones_total, zones_done)
     VALUES ($1, 'queued', $2, 0) RETURNING id`,
    [orgId, zonesTotal]
  );
  return row?.id ?? null;
}

export async function updateImportJobProgress(
  jobId: string,
  zonesDone: number,
  status: 'running' | 'completed' | 'failed',
  error?: string
): Promise<void> {
  await dbQueryOne(
    `UPDATE import_jobs SET zones_done = $2, status = $3, error = $4, updated_at = now() WHERE id = $1`,
    [jobId, zonesDone, status, error ?? null]
  );
}

/** Dispara pipeline satelital para una org recién importada. */
export async function triggerOnboardingBackfill(
  baseUrl: string,
  cronSecret: string,
  orgId: string
): Promise<void> {
  const headers = { Authorization: `Bearer ${cronSecret}` };
  try {
    await fetch(
      `${baseUrl}/api/cron/fetch-metrics?job=onboarding&orgId=${encodeURIComponent(orgId)}`,
      { headers }
    );
  } catch {
    /* worker may retry */
  }
}
