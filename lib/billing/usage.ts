import { dbQueryOne } from '@/lib/db/pool';
import { isDatabaseConfigured } from '@/lib/db/config';
import { MOCK_FIELDS } from '@/lib/mock-data/fields';

export interface OrgHectareUsage {
  totalHa: number;
  fieldCount: number;
}

export async function getOrgHectareUsage(orgId: string): Promise<OrgHectareUsage> {
  if (!isDatabaseConfigured()) {
    const totalHa = MOCK_FIELDS.reduce((sum, f) => sum + f.area, 0);
    return { totalHa, fieldCount: MOCK_FIELDS.length };
  }

  const row = await dbQueryOne<{ total_ha: string; field_count: number }>(
    `SELECT COALESCE(SUM(area_ha), 0)::numeric AS total_ha,
            COUNT(*)::int AS field_count
     FROM fields WHERE org_id = $1`,
    [orgId]
  );

  return {
    totalHa: Number(row?.total_ha ?? 0),
    fieldCount: row?.field_count ?? 0,
  };
}
