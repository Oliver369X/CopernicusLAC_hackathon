import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db/config';
import { createServiceClient } from '@/lib/supabase/server';
import { downloadObject } from '@/lib/storage/minio';
import { analyzeCropImage } from '@/lib/services/vision-service';
import { getFieldByIdFromDb } from '@/lib/data/fields';
import { getFieldById } from '@/lib/mock-data/fields';
import {
  getLatestSatelliteForZones,
  getLatestWeatherForField,
  getSatelliteHistoryForZone,
} from '@/lib/data/zone-satellite-metrics';
import {
  buildSatelliteContext,
  correlateVisionWithSatellite,
} from '@/lib/services/satellite-correlation';
import {
  analyzeCropMultisensor,
  resolveScienceCrop,
} from '@/lib/science/analyze';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    observationId?: string;
    imageData?: string;
    fieldId?: string;
    zoneId?: string;
  };

  const { observationId, imageData, fieldId = 'field-1', zoneId } = body;

  let image = imageData;
  const service =
    isDatabaseConfigured() ? await createServiceClient() : null;

  if (!image && observationId && service) {
    const { data } = await service
      .from('observations')
      .select('image_path, field_id, zone_id')
      .eq('id', observationId)
      .maybeSingle();

    if (data?.image_path) {
      const imagePath = data.image_path as string;
      if (imagePath.startsWith('http')) {
        const imgRes = await fetch(imagePath);
        const buf = await imgRes.arrayBuffer();
        image = `data:image/jpeg;base64,${Buffer.from(buf).toString('base64')}`;
      } else {
        const buf = await downloadObject(imagePath);
        if (buf) {
          image = `data:image/jpeg;base64,${buf.toString('base64')}`;
        }
      }
    }
  }

  if (!image) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  const field = (await getFieldByIdFromDb(fieldId)) ?? getFieldById(fieldId);
  const zone = field?.zones.find((z) => z.id === zoneId) ?? field?.zones[0];

  let ctx = buildSatelliteContext(
    null,
    null,
    [],
    {
      ndvi: zone?.ndviAverage ?? 0.6,
      ndmi: zone?.ndmiAverage ?? 0.45,
      temp: zone?.temperatureAverage ?? 25,
      soil: zone?.soilMoistureAverage ?? 65,
    }
  );

  if (service && zone) {
    const satMap = await getLatestSatelliteForZones(service, [zone.id]);
    const weather = field ? await getLatestWeatherForField(service, field.id) : null;
    const history = await getSatelliteHistoryForZone(service, zone.id, 14);
    ctx = buildSatelliteContext(
      satMap.get(zone.id) ?? null,
      weather,
      history,
      {
        ndvi: zone.ndviAverage,
        ndmi: zone.ndmiAverage,
        temp: zone.temperatureAverage,
        soil: zone.soilMoistureAverage,
      }
    );
  }

  let scienceAnalysis = null;
  if (service && field && zone) {
    const scienceCrop = resolveScienceCrop(field);
    if (scienceCrop) {
      try {
        scienceAnalysis = await analyzeCropMultisensor(
          scienceCrop,
          field,
          zone.id,
          service
        );
      } catch {
        scienceAnalysis = null;
      }
    }
  }

  const visionAnalysis = await analyzeCropImage(
    image,
    field?.crop ?? 'soybean',
    ctx,
    scienceAnalysis
  );

  const correlation = correlateVisionWithSatellite(visionAnalysis, ctx);

  if (observationId && service) {
    await service
      .from('observations')
      .update({
        vision_result: {
          visionAnalysis,
          correlation,
          satelliteContext: ctx,
          scienceAnalysis,
        },
      })
      .eq('id', observationId);
  }

  return NextResponse.json({
    observationId,
    visionAnalysis,
    correlation,
    satelliteContext: ctx,
    scienceAnalysis,
    disclaimer:
      'Este diagnóstico es orientativo y no sustituye la evaluación de un agrónomo certificado.',
  });
}
