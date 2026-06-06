import { NextResponse } from 'next/server';
import { getDbService } from '@/lib/db/get-service';
import { getFieldByIdFromDb } from '@/lib/data/fields';
import { getFieldById } from '@/lib/mock-data/fields';
import {
  getSatelliteHistoryForZone,
  getSatelliteReadingsForZoneRange,
} from '@/lib/data/zone-satellite-metrics';
import { isScienceCrop } from '@/lib/science/crops/registry';
import { computeDpRvi } from '@/lib/science/indices/radar';
import { hasSatelliteCredentialsConfigured } from '@/lib/config/satellite';

function defaultFromTo(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - days);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

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
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

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
    let from = fromParam;
    let to = toParam;

    const service = await getDbService();

    if (service) {
      if (fromParam && toParam) {
        const history = await getSatelliteReadingsForZoneRange(
          service,
          zone.id,
          fromParam,
          toParam
        );
        series = history.map((h) => mapPoint(h));
      } else {
        const { from: f, to: t } = defaultFromTo(days);
        from = f;
        to = t;
        const history = await getSatelliteReadingsForZoneRange(
          service,
          zone.id,
          f,
          t
        );
        if (history.length) {
          series = history.map((h) => mapPoint(h));
        } else {
          const fallback = await getSatelliteHistoryForZone(service, zone.id, days);
          series = fallback.map((h) => mapPoint(h));
        }
      }
    }

    if (!series.length && hasSatelliteCredentialsConfigured()) {
      return NextResponse.json({
        crop,
        fieldId,
        zoneId: zone.id,
        days,
        from,
        to,
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
      from,
      to,
      series,
      source: series.length ? 'satellite_readings' : 'mock',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Timeseries failed';
    console.error('[science/timeseries]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function mapPoint(h: {
  captured_at: string;
  reading_date?: string;
  ndvi: number;
  ndmi: number;
  ndre?: number | null;
  s1_vv?: number | null;
  s1_vh?: number | null;
  science_metadata?: { dpRvi?: number; evi?: number } | null;
}) {
  const meta = h.science_metadata;
  const vv = h.s1_vv;
  const vh = h.s1_vh;
  return {
    capturedAt: h.reading_date ? `${h.reading_date}T12:00:00.000Z` : h.captured_at,
    readingDate: h.reading_date ?? h.captured_at.split('T')[0],
    ndvi: h.ndvi,
    ndre: h.ndre ?? null,
    ndmi: h.ndmi,
    evi: meta?.evi ?? null,
    dpRvi: meta?.dpRvi ?? (vv && vh ? computeDpRvi(vv, vh) : null),
  };
}
