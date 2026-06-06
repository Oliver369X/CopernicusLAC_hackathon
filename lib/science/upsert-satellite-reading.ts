import type { DbClient } from '@/lib/db/adapter';
import type { Field, FieldZone } from '@/lib/types/field';
import type { ZoneSatelliteReading } from '@/lib/services/satellite';
import {
  fetchScienceVectorsForZone,
  scienceMetadataFromReading,
} from '@/lib/science/science-ingest';
import { isScienceCrop } from '@/lib/science/crops/registry';

export interface UpsertSatelliteResult {
  readingDate: string;
  zoneId: string;
}

/** Persiste una lectura satelital en satellite_readings (upsert por zona/día). */
export async function upsertSatelliteReading(
  service: DbClient,
  zone: FieldZone,
  field: Field,
  reading: ZoneSatelliteReading
): Promise<UpsertSatelliteResult> {
  const readingDate = new Date().toISOString().split('T')[0];
  const vectors = isScienceCrop(field.crop)
    ? await fetchScienceVectorsForZone(zone, field.crop, reading.s3Lst)
    : null;

  const scienceMeta = scienceMetadataFromReading(
    field.crop,
    reading.s1Vv,
    reading.s1Vh,
    vectors
  );

  const row = {
    zone_id: zone.id,
    ndvi: Number.isFinite(reading.ndvi) ? reading.ndvi : zone.ndviAverage,
    ndmi: Number.isFinite(reading.ndmi) ? reading.ndmi : zone.ndmiAverage,
    ndre: Number.isFinite(reading.ndre ?? NaN) ? reading.ndre : null,
    s1_vh: reading.s1Vh,
    s1_vv: reading.s1Vv,
    s1_moisture_index: reading.s1MoistureIndex,
    s3_lst: reading.s3Lst,
    cloud_cover: reading.cloudCover,
    ndvi_grid: reading.ndviGrid,
    scene_date: reading.sceneDate,
    source: reading.source,
    reading_date: readingDate,
    science_metadata: scienceMeta,
    raw_metadata: {
      ...reading.rawMetadata,
      missions: reading.missions,
      gridStatus: reading.rawMetadata.gridStatus ?? (reading.ndviGrid ? 'ok' : 'missing'),
    },
    captured_at: reading.capturedAt,
  };

  const { error } = await service
    .from('satellite_readings')
    .upsert(row, { onConflict: 'zone_id,reading_date' });

  if (error) {
    await service.from('satellite_readings').insert(row);
  }

  await service
    .from('zones')
    .update({
      ndvi_average: Number.isFinite(reading.ndvi) ? reading.ndvi : zone.ndviAverage,
      ndmi_average: Number.isFinite(reading.ndmi) ? reading.ndmi : zone.ndmiAverage,
    })
    .eq('id', zone.id);

  return { readingDate, zoneId: zone.id };
}
