import { dbQuery, dbQueryOne } from '@/lib/db/pool';
import { isDatabaseConfigured } from '@/lib/db/config';

export async function getActiveImportJobForOrg(orgId: string): Promise<{
  id: string;
  zones_total: number;
  zones_done: number;
  status: string;
} | null> {
  if (!isDatabaseConfigured()) return null;
  return dbQueryOne(
    `SELECT id, zones_total, zones_done, status FROM import_jobs
     WHERE org_id = $1 AND status IN ('queued', 'running')
     ORDER BY created_at DESC LIMIT 1`,
    [orgId]
  );
}

export async function markImportJobRunning(jobId: string): Promise<void> {
  await dbQuery(
    `UPDATE import_jobs SET status = 'running', updated_at = now() WHERE id = $1`,
    [jobId]
  );
}

export async function incrementImportJobZone(jobId: string): Promise<void> {
  const row = await dbQueryOne<{ zones_done: number; zones_total: number }>(
    `UPDATE import_jobs SET zones_done = zones_done + 1, updated_at = now()
     WHERE id = $1 RETURNING zones_done, zones_total`,
    [jobId]
  );
  if (row && row.zones_done >= row.zones_total) {
    await dbQuery(
      `UPDATE import_jobs SET status = 'completed', updated_at = now() WHERE id = $1`,
      [jobId]
    );
  }
}

export async function completeStaleImportJobs(): Promise<void> {
  await dbQuery(
    `UPDATE import_jobs SET status = 'completed', updated_at = now()
     WHERE status = 'running' AND zones_done >= zones_total`
  );
}

export async function getOrgIdsWithPendingImportJobs(): Promise<string[]> {
  const rows = await dbQuery<{ org_id: string }>(
    `SELECT DISTINCT org_id FROM import_jobs WHERE status IN ('queued', 'running')`
  );
  return rows.map((r) => r.org_id);
}
