import { NextResponse } from 'next/server';
import { getDbService } from '@/lib/db/get-service';
import { getFieldByIdFromDb } from '@/lib/data/fields';
import { getFieldById } from '@/lib/mock-data/fields';
import { analyzeCropMultisensor } from '@/lib/science/analyze';
import { isScienceCrop } from '@/lib/science/crops/registry';
import type { ScienceCropId } from '@/lib/science/types';
import { hasSatelliteCredentialsConfigured } from '@/lib/config/satellite';
import {
  fetchZoneSatelliteReading,
} from '@/lib/services/satellite';
import { upsertSatelliteReading } from '@/lib/science/upsert-satellite-reading';
import { persistScienceTimeseries } from '@/lib/science/persist-timeseries';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ crop: string }> }
) {
  try {
    const { crop } = await params;
    if (!isScienceCrop(crop)) {
      return NextResponse.json({ error: 'Crop not supported for science module' }, { status: 400 });
    }

    if (!hasSatelliteCredentialsConfigured()) {
      return NextResponse.json(
        { error: 'Copernicus no configurado' },
        { status: 503 }
      );
    }

    const body = (await request.json()) as { fieldId?: string; zoneId?: string };
    const { fieldId, zoneId } = body;

    if (!fieldId) {
      return NextResponse.json({ error: 'fieldId required' }, { status: 400 });
    }

    const field =
      (await getFieldByIdFromDb(fieldId)) ?? getFieldById(fieldId);

    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    if (field.crop !== crop) {
      return NextResponse.json(
        { error: `Field crop is ${field.crop}, expected ${crop}` },
        { status: 400 }
      );
    }

    const zone =
      field.zones.find((z) => z.id === zoneId) ?? field.zones[0];
    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    const reading = await fetchZoneSatelliteReading(zone, field.center);

    if (reading.source === 'mock' || !Number.isFinite(reading.ndvi)) {
      return NextResponse.json(
        { error: 'Sin escena para la zona' },
        { status: 422 }
      );
    }

    const service = await getDbService();
    if (!service) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const upserted = await upsertSatelliteReading(service, zone, field, reading);

    const analysis = await analyzeCropMultisensor(
      crop as ScienceCropId,
      field,
      zone.id,
      service,
      { allowLiveFetch: true }
    );

    await persistScienceTimeseries(service, field.id, field.crop, analysis);

    return NextResponse.json({
      ok: true,
      provenance: analysis.provenance,
      analysis,
      readingDate: upserted.readingDate,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Refresh failed';
    console.error('[science/refresh]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
