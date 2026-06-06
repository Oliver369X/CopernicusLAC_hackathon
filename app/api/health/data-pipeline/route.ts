import { NextResponse } from 'next/server';
import { dbQueryOne } from '@/lib/db/pool';
import { isDatabaseConfigured } from '@/lib/db/config';
import { getSessionOrg } from '@/lib/auth/org';

const SCIENCE_ZONE_COUNT = 11;

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      configured: false,
      zonesTotal: 0,
      zonesWithBounds: 0,
      zonesWithSatellite: 0,
      lastCronAt: null,
      satelliteCoverage: {
        totalScienceZones: SCIENCE_ZONE_COUNT,
        zonesWithReadingLast14d: 0,
        oldestGapDays: null,
        lastCronRecommendation: 'pnpm cron:satellite',
      },
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

  const coverage = await dbQueryOne<{
    zones_recent: string;
    max_gap: string | null;
  }>(
    `SELECT
      COUNT(DISTINCT zone_id) FILTER (
        WHERE reading_date >= CURRENT_DATE - INTERVAL '14 days'
      )::text AS zones_recent,
      MAX(CURRENT_DATE - reading_date)::text AS max_gap
    FROM satellite_readings
    WHERE zone_id LIKE 'zone-sj-%'`
  );

  let lastCronAt: string | null = null;
  try {
    const lastCron = await dbQueryOne<{ finished_at: string }>(
      `SELECT finished_at::text FROM cron_runs ORDER BY finished_at DESC LIMIT 1`
    );
    lastCronAt = lastCron?.finished_at ?? null;
  } catch {
    lastCronAt = null;
  }

  const zonesWithReadingLast14d = Number(coverage?.zones_recent ?? 0);
  const oldestGapDays =
    coverage?.max_gap != null ? Number(coverage.max_gap) : null;

  return NextResponse.json({
    configured: true,
    zonesTotal: Number(stats?.zones_total ?? 0),
    zonesWithBounds: Number(stats?.zones_with_bounds ?? 0),
    zonesWithSatellite: Number(stats?.zones_with_satellite ?? 0),
    lastCronAt,
    satelliteCoverage: {
      totalScienceZones: SCIENCE_ZONE_COUNT,
      zonesWithReadingLast14d,
      oldestGapDays,
      lastCronRecommendation: 'pnpm cron:satellite',
    },
  });
}
