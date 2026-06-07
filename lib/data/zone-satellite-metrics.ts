import type { DbClient } from '@/lib/db/adapter';

export interface ZoneSatelliteSnapshot {
  zoneId: string;
  readingDate?: string;
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
  reading_date?: string;
  ndvi: number;
  ndmi: number;
  ndre?: number | null;
  s1_vv?: number | null;
  s1_vh?: number | null;
  source?: string;
  science_metadata?: { dpRvi?: number; evi?: number; lst?: number; optical?: Record<string, number>; radar?: Record<string, number> } | null;
}

const SATELLITE_SELECT =
  'zone_id, ndvi, ndmi, ndre, s1_moisture_index, s3_lst, cloud_cover, scene_date, source, ndvi_grid, captured_at, reading_date, s1_vv, s1_vh, science_metadata';

/** Normaliza reading_date de Postgres a YYYY-MM-DD. */
export function normalizeReadingDate(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().split('T')[0];
  }
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.split('T')[0];
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return undefined;
}

function rowToSnapshot(row: Record<string, unknown>): ZoneSatelliteSnapshot {
  const readingDate = normalizeReadingDate(row.reading_date);
  return {
    zoneId: String(row.zone_id),
    readingDate,
    ndvi: Number(row.ndvi),
    ndmi: Number(row.ndmi),
    ndre: row.ndre != null ? Number(row.ndre) : null,
    s1MoistureIndex:
      row.s1_moisture_index != null ? Number(row.s1_moisture_index) : null,
    s3Lst: row.s3_lst != null ? Number(row.s3_lst) : null,
    cloudCover: row.cloud_cover != null ? Number(row.cloud_cover) : null,
    sceneDate: row.scene_date != null ? String(row.scene_date).split('T')[0] : null,
    source: row.source != null ? String(row.source) : 'unknown',
    ndviGrid: row.ndvi_grid as ZoneSatelliteSnapshot['ndviGrid'],
    capturedAt: String(row.captured_at),
  };
}

function rowToHistoryPoint(row: Record<string, unknown>): ZoneHistoryPoint {
  const readingDate = normalizeReadingDate(row.reading_date);
  return {
    captured_at: readingDate
      ? `${readingDate}T12:00:00.000Z`
      : String(row.captured_at),
    reading_date: readingDate,
    ndvi: Number(row.ndvi),
    ndmi: Number(row.ndmi),
    ndre: row.ndre != null ? Number(row.ndre) : null,
    s1_vv: row.s1_vv != null ? Number(row.s1_vv) : null,
    s1_vh: row.s1_vh != null ? Number(row.s1_vh) : null,
    science_metadata: row.science_metadata as ZoneHistoryPoint['science_metadata'],
    source: row.source != null ? String(row.source) : undefined,
  };
}

/** Lectura satelital exacta para zona y fecha (YYYY-MM-DD). */
export async function getSatelliteReadingForZoneOnDate(
  service: DbClient,
  zoneId: string,
  date: string
): Promise<ZoneSatelliteSnapshot | null> {
  const { data } = await service
    .from('satellite_readings')
    .select(SATELLITE_SELECT)
    .eq('zone_id', zoneId)
    .eq('reading_date', date)
    .maybeSingle();

  if (!data) return null;
  return rowToSnapshot(data as Record<string, unknown>);
}

/** Lectura más reciente en o antes de la fecha indicada. */
export async function getNearestReadingOnOrBefore(
  service: DbClient,
  zoneId: string,
  date: string
): Promise<ZoneSatelliteSnapshot | null> {
  const { data } = await service
    .from('satellite_readings')
    .select(SATELLITE_SELECT)
    .eq('zone_id', zoneId)
    .lte('reading_date', date)
    .order('reading_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return rowToSnapshot(data as Record<string, unknown>);
}

/** Fechas disponibles en DB para una zona (DESC, sin duplicados). */
export async function listAvailableReadingDates(
  service: DbClient,
  zoneId: string,
  limit = 30
): Promise<string[]> {
  const { data } = await service
    .from('satellite_readings')
    .select('reading_date')
    .eq('zone_id', zoneId)
    .order('reading_date', { ascending: false })
    .limit(limit * 2);

  const seen = new Set<string>();
  const dates: string[] = [];
  for (const row of data ?? []) {
    const d = normalizeReadingDate((row as { reading_date: unknown }).reading_date);
    if (!d) continue;
    if (!seen.has(d)) {
      seen.add(d);
      dates.push(d);
      if (dates.length >= limit) break;
    }
  }
  return dates;
}

/** Serie histórica entre dos fechas inclusive. */
export async function getSatelliteReadingsForZoneRange(
  service: DbClient,
  zoneId: string,
  from: string,
  to: string
): Promise<ZoneHistoryPoint[]> {
  const { data } = await service
    .from('satellite_readings')
    .select('captured_at, reading_date, ndvi, ndmi, ndre, s1_vv, s1_vh, source, science_metadata')
    .eq('zone_id', zoneId)
    .gte('reading_date', from)
    .lte('reading_date', to)
    .order('reading_date', { ascending: true });

  return (data ?? []).map((r) => rowToHistoryPoint(r as Record<string, unknown>));
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
