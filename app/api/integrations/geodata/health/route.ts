import { NextResponse } from 'next/server';
import {
  checkGeodataHealth,
  getParcelSeries,
  probeParcelEndpoint,
} from '@/lib/integrations/geodata/client';
import { getGeodataBaseUrl, isGeodataEnabled } from '@/lib/integrations/geodata/registry';
import type { GeodataDataQuality, GeodataHealthStatus } from '@/lib/integrations/geodata/types';

const DEMO_PARCEL = 'SJ-NORTE-001';
const SERIES_PARCELS = ['LUCIA-SOJA-10', 'ROSA-SOJA-500'] as const;

async function probeSeriesQuality(
  parcelKey: string
): Promise<GeodataDataQuality | undefined> {
  const series = await getParcelSeries(
    parcelKey,
    1095,
    'optical',
    '2023-01-01',
    '2025-12-31'
  );
  return series?.dataQuality;
}

export async function GET(): Promise<NextResponse<GeodataHealthStatus>> {
  if (!isGeodataEnabled()) {
    return NextResponse.json({
      ok: false,
      geodataEnabled: false,
      reason: 'disabled',
    });
  }

  const baseUrl = getGeodataBaseUrl();
  const { healthStatus, dbConnected } = await checkGeodataHealth();
  const parcelStatus = await probeParcelEndpoint(DEMO_PARCEL);

  const seriesEntries = await Promise.all(
    SERIES_PARCELS.map(async (key) => [key, await probeSeriesQuality(key)] as const)
  );
  const seriesQuality = Object.fromEntries(
    seriesEntries.filter(([, q]) => q != null)
  ) as Record<string, GeodataDataQuality>;

  const ok =
    healthStatus === 200 &&
    parcelStatus === 200 &&
    SERIES_PARCELS.every((key) => seriesQuality[key] === 'cdse');

  return NextResponse.json({
    ok,
    geodataEnabled: true,
    baseUrl,
    healthStatus,
    dbConnected,
    parcelSample: DEMO_PARCEL,
    parcelStatus,
    seriesQuality,
  });
}
