import { NextResponse } from 'next/server';
import {
  checkGeodataHealth,
  probeParcelEndpoint,
} from '@/lib/integrations/geodata/client';
import { getGeodataBaseUrl, isGeodataEnabled } from '@/lib/integrations/geodata/registry';
import type { GeodataHealthStatus } from '@/lib/integrations/geodata/types';

const DEMO_PARCEL = 'SJ-NORTE-001';

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

  const ok = healthStatus === 200 && parcelStatus === 200;

  return NextResponse.json({
    ok,
    geodataEnabled: true,
    baseUrl,
    healthStatus,
    dbConnected,
    parcelSample: DEMO_PARCEL,
    parcelStatus,
  });
}
