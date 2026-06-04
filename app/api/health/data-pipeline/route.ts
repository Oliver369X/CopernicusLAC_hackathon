import { NextResponse } from 'next/server';
import { dbQueryOne } from '@/lib/db/pool';
import { isDatabaseConfigured } from '@/lib/db/config';
import { getSessionOrg } from '@/lib/auth/org';

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      configured: false,
      zonesTotal: 0,
      zonesWithBounds: 0,
      zonesWithSatellite: 0,
      lastCronAt: null,
    });
  }

  const org = await getSessionOrg();
  const params: unknown[] = [];
  const orgFilter = org?.orgId ? 'AND f.org_id = $1::uuid' : '';
  if (org?.orgId) params.push(org.orgId);

  const stats = await dbQueryOne<{
    zones_total: string;
    zones_with_bounds: string;
    zones_with_satellite: string;
  }>(
    `SELECT
      COUNT(z.id)::text AS zones_total,
      COUNT(z.id) FILTER (WHERE z.bounds IS NOT NULL AND z.bounds::text <> '{}'
        AND (z.bounds->>'type' = 'Polygon' OR jsonb_array_length(z.bounds) >= 4))::text AS zones_with_bounds,
      COUNT(DISTINCT sr.zone_id)::text AS zones_with_satellite
    FROM zones z
    JOIN fields f ON f.id = z.field_id
    LEFT JOIN satellite_readings sr ON sr.zone_id = z.id
    WHERE 1=1 ${orgFilter}`,
    params
  );

  const lastCron = await dbQueryOne<{ finished_at: string }>(
    `SELECT finished_at::text FROM cron_runs ORDER BY finished_at DESC LIMIT 1`
  );

  return NextResponse.json({
    configured: true,
    zonesTotal: Number(stats?.zones_total ?? 0),
    zonesWithBounds: Number(stats?.zones_with_bounds ?? 0),
    zonesWithSatellite: Number(stats?.zones_with_satellite ?? 0),
    lastCronAt: lastCron?.finished_at ?? null,
  });
}
