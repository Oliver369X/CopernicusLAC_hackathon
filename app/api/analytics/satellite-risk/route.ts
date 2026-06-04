import { NextResponse } from 'next/server';
import { getDbService } from '@/lib/db/get-service';
import { getFields } from '@/lib/data/fields';
import { buildSatelliteRiskTimeline } from '@/lib/analytics/satellite-risk';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get('range') ?? 'month';
  const range =
    rangeParam === 'week' || rangeParam === 'season' ? rangeParam : 'month';

  const service = await getDbService();
  const fields = await getFields();
  const timeline = await buildSatelliteRiskTimeline(service, fields, range);

  return NextResponse.json({
    range,
    source: service ? 'satellite_readings' : 'unavailable',
    timeline,
  });
}
