import { NextResponse } from 'next/server';
import { getDbService } from '@/lib/db/get-service';
import { getFieldByIdFromDb } from '@/lib/data/fields';
import { getFieldById } from '@/lib/mock-data/fields';
import { getSatelliteHistoryForZone } from '@/lib/data/zone-satellite-metrics';
import { isScienceCrop } from '@/lib/science/crops/registry';
import { computeDpRvi } from '@/lib/science/indices/radar';
import { hasSatelliteCredentialsConfigured } from '@/lib/config/satellite';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ crop: string }> }
) {
  try {
    const { crop } = await params;
    if (!isScienceCrop(crop)) {
      return NextResponse.json({ error: 'Unsupported crop' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('fieldId');
    const zoneId = searchParams.get('zoneId');
    const days = parseInt(searchParams.get('days') ?? '90', 10);

    if (!fieldId) {
      return NextResponse.json({ error: 'fieldId required' }, { status: 400 });
    }

    const field = (await getFieldByIdFromDb(fieldId)) ?? getFieldById(fieldId);
    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    const zone = field.zones.find((z) => z.id === zoneId) ?? field.zones[0];
    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    let series: Array<Record<string, unknown>> = [];

    const service = await getDbService();

    if (service) {
      const history = await getSatelliteHistoryForZone(service, zone.id, days);
      series = history.map((h) => {
        const meta = (h as { science_metadata?: { dpRvi?: number; evi?: number } }).science_metadata;
        const vv = (h as { s1_vv?: number }).s1_vv;
        const vh = (h as { s1_vh?: number }).s1_vh;
        return {
          capturedAt: h.captured_at,
          ndvi: h.ndvi,
          ndre: (h as { ndre?: number }).ndre ?? null,
          ndmi: h.ndmi,
          evi: meta?.evi ?? null,
          dpRvi: meta?.dpRvi ?? (vv && vh ? computeDpRvi(vv, vh) : null),
        };
      });
    }

    if (!series.length && hasSatelliteCredentialsConfigured()) {
      return NextResponse.json({
        crop,
        fieldId,
        zoneId: zone.id,
        days,
        series: [],
        message: 'Sin historial satelital — ejecuta pnpm cron:backfill',
        source: 'pending',
      });
    }

    return NextResponse.json({
      crop,
      fieldId,
      zoneId: zone.id,
      days,
      series,
      source: series.length ? 'satellite_readings' : 'mock',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Timeseries failed';
    console.error('[science/timeseries]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
