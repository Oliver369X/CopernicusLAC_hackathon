import { dbQueryOne } from '@/lib/db/pool';
import { getActiveImportJobForOrg, incrementImportJobZone } from '@/lib/import-jobs/active-job';

export async function trackImportJobProgressForZone(zoneId: string): Promise<void> {
  try {
    const row = await dbQueryOne<{ org_id: string }>(
      `SELECT f.org_id::text AS org_id FROM zones z
       JOIN fields f ON f.id = z.field_id WHERE z.id = $1`,
      [zoneId]
    );
    if (!row?.org_id) return;
    const job = await getActiveImportJobForOrg(row.org_id);
    if (job) await incrementImportJobZone(job.id);
  } catch {
    /* non-fatal */
  }
}
