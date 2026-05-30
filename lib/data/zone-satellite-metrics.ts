import type { DbClient } from '@/lib/db/adapter';

export interface ZoneSatelliteSnapshot {
  zoneId: string;
  ndvi: number;
  ndmi: number;
  ndre: number | null;
  s1MoistureIndex: number | null;
  s3Lst: number | null;
  cloudCover: number | null;
  sceneDate: string | null;
  source: string;
  ndviGrid: {
    size: number;
    ndvi: number[][];
    ndmi: number[][];
    min: number;
    max: number;
  } | null;
  capturedAt: string;
}

export interface ZoneWeatherSnapshot {
  temp: number;
  humidity: number;
  soilMoisture: number | null;
  capturedAt: string;
}

export interface ZoneHistoryPoint {
  captured_at: string;
  ndvi: number;
  ndmi: number;
  ndre?: number | null;
  s1_vv?: number | null;
  s1_vh?: number | null;
  science_metadata?: { dpRvi?: number; evi?: number } | null;
}

export async function getLatestSatelliteForZones(
  service: DbClient,
  zoneIds: string[]
): Promise<Map<string, ZoneSatelliteSnapshot>> {
  const map = new Map<string, ZoneSatelliteSnapshot>();
  if (!zoneIds.length) return map;

  const { data } = await service
    .from('satellite_readings')
    .select(
      'zone_id, ndvi, ndmi, ndre, s1_moisture_index, s3_lst, cloud_cover, scene_date, source, ndvi_grid, captured_at'
    )
    .in('zone_id', zoneIds)
    .order('captured_at', { ascending: false });

  for (const row of data ?? []) {
    const zoneId = String(row.zone_id);
    if (map.has(zoneId)) continue;
    map.set(zoneId, {
      zoneId,
      ndvi: Number(row.ndvi),
      ndmi: Number(row.ndmi),
      ndre: row.ndre != null ? Number(row.ndre) : null,
      s1MoistureIndex:
        row.s1_moisture_index != null ? Number(row.s1_moisture_index) : null,
      s3Lst: row.s3_lst != null ? Number(row.s3_lst) : null,
      cloudCover: row.cloud_cover != null ? Number(row.cloud_cover) : null,
      sceneDate: row.scene_date != null ? String(row.scene_date) : null,
      source: row.source != null ? String(row.source) : 'unknown',
      ndviGrid: row.ndvi_grid as ZoneSatelliteSnapshot['ndviGrid'],
      capturedAt: String(row.captured_at),
    });
  }

  return map;
}

export async function getSatelliteHistoryForZone(
  service: DbClient,
  zoneId: string,
  limit = 14
): Promise<ZoneHistoryPoint[]> {
  const { data } = await service
    .from('satellite_readings')
    .select(
      'captured_at, ndvi, ndmi, ndre, s1_vv, s1_vh, science_metadata'
    )
    .eq('zone_id', zoneId)
    .order('captured_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map((r) => ({
    captured_at: String(r.captured_at),
    ndvi: Number(r.ndvi),
    ndmi: Number(r.ndmi),
    ndre: r.ndre != null ? Number(r.ndre) : null,
    s1_vv: r.s1_vv != null ? Number(r.s1_vv) : null,
    s1_vh: r.s1_vh != null ? Number(r.s1_vh) : null,
    science_metadata: r.science_metadata as ZoneHistoryPoint['science_metadata'],
  }));
}

export async function getLatestWeatherForField(
  service: DbClient,
  fieldId: string
): Promise<ZoneWeatherSnapshot | null> {
  const { data } = await service
    .from('weather_readings')
    .select('temp, humidity, soil_moisture, captured_at')
    .eq('field_id', fieldId)
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    temp: Number(data.temp),
    humidity: Number(data.humidity),
    soilMoisture: data.soil_moisture != null ? Number(data.soil_moisture) : null,
    capturedAt: String(data.captured_at),
  };
}
