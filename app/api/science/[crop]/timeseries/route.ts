import { NextResponse } from 'next/server';
import { getFieldById } from '@/lib/mock-data/fields';
import { getFieldByIdFromDb } from '@/lib/data/fields';
import { isScienceCrop } from '@/lib/science/crops/registry';
import { computeDpRvi } from '@/lib/science/indices/radar';
import { hasSatelliteCredentialsConfigured } from '@/lib/config/satellite';
import { resolveTimeseriesForField } from '@/lib/integrations/geodata/timeseries-adapter';

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

    const resolved = await resolveTimeseriesForField(fieldId, zone.id, {
      from: fromParam ?? undefined,
      to: toParam ?? undefined,
      days,
    });

    const from =
      fromParam ??
      (resolved.points[0]?.date ??
        (() => {
          const d = new Date();
          d.setUTCDate(d.getUTCDate() - days);
          return d.toISOString().split('T')[0];
        })());
    const to =
      toParam ??
      resolved.points[resolved.points.length - 1]?.date ??
      new Date().toISOString().split('T')[0];

    const series = resolved.points.map((p) => ({
      capturedAt: `${p.date}T12:00:00.000Z`,
      readingDate: p.date,
      ndvi: p.ndvi,
      ndre: p.ndre ?? null,
      ndmi: p.ndmi ?? null,
      evi: p.evi ?? null,
      dpRvi: p.dpRvi ?? null,
    }));

    if (!series.length && hasSatelliteCredentialsConfigured()) {
      return NextResponse.json({
        crop,
        fieldId,
        zoneId: zone.id,
        days,
        from,
        to,
        series: [],
        source: 'pending',
        fallbackUsed: resolved.fallbackUsed,
        message: 'Sin historial satelital — ejecuta pnpm cron:backfill',
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
      source: resolved.source,
      dataQuality: resolved.dataQuality,
      parcelKey: resolved.parcelKey,
      fallbackUsed: resolved.fallbackUsed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Timeseries failed';
    console.error('[science/timeseries]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
