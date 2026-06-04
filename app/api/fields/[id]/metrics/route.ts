import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db/config';
import { createClient } from '@/lib/supabase/server';
import { getFieldByIdFromDb } from '@/lib/data/fields';
import { getFieldById } from '@/lib/mock-data/fields';
import { hasSatelliteCredentialsConfigured } from '@/lib/config/satellite';

interface SatelliteRow {
  captured_at: string;
  ndvi: number;
  ndmi: number;
  ndre?: number | null;
  zone_id: string;
  source?: string;
  s1_moisture_index?: number | null;
  s3_lst?: number | null;
  cloud_cover?: number | null;
  ndvi_grid?: {
    size: number;
    ndvi: number[][];
    ndmi: number[][];
    min: number;
    max: number;
  } | null;
  scene_date?: string | null;
  raw_metadata?: { missions?: string[] };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const zoneId = searchParams.get('zoneId');

  const field =
    (await getFieldByIdFromDb(id)) ?? getFieldById(id);

  if (!field) {
    return NextResponse.json({ error: 'Field not found' }, { status: 404 });
  }

  const zones = zoneId
    ? field.zones.filter((z) => z.id === zoneId)
    : field.zones;

  const avgNdvi =
    zones.reduce((s, z) => s + z.ndviAverage, 0) / zones.length;
  const avgNdmi =
    zones.reduce((s, z) => s + z.ndmiAverage, 0) / zones.length;

  let satelliteHistory: SatelliteRow[] = [];
  let weatherHistory: Array<{
    captured_at: string;
    temp: number;
    humidity: number;
    soil_moisture?: number | null;
  }> = [];
  let latestGrid: SatelliteRow['ndvi_grid'] = null;
  let missions: string[] = [];
  let cloudCover: number | null = null;
  let sceneDate: string | null = null;
  let s1MoistureIndex: number | null = null;
  let s3Lst: number | null = null;
  let dataSource = 'mock';
  let satellitePending = false;

  if (isDatabaseConfigured()) {
    const supabase = await createClient();
    const zoneIds = zones.map((z) => z.id);

    const { data: sat } = await supabase
      .from('satellite_readings')
      .select(
        'captured_at, ndvi, ndmi, ndre, zone_id, source, s1_moisture_index, s3_lst, cloud_cover, ndvi_grid, scene_date, raw_metadata'
      )
      .in('zone_id', zoneIds)
      .order('captured_at', { ascending: false })
      .limit(30);

    if (sat?.length) {
      satelliteHistory = sat as unknown as SatelliteRow[];
      dataSource = 'database';

      const latest = satelliteHistory[0];
      latestGrid = latest.ndvi_grid ?? null;
      cloudCover = latest.cloud_cover ?? null;
      sceneDate = latest.scene_date ?? null;
      s1MoistureIndex = latest.s1_moisture_index ?? null;
      s3Lst = latest.s3_lst ?? null;
      missions = latest.raw_metadata?.missions ?? [];
    }

    const { data: weather } = await supabase
      .from('weather_readings')
      .select('captured_at, temp, humidity, soil_moisture')
      .eq('field_id', id)
      .order('captured_at', { ascending: false })
      .limit(30);

    if (weather?.length) {
      weatherHistory = weather as typeof weatherHistory;
    }
  }

  const latestSat = satelliteHistory[0];
  const soilFromWeather = weatherHistory[0]?.soil_moisture;
  const hasCredentials = hasSatelliteCredentialsConfigured();

  if (hasCredentials && !latestSat) {
    satellitePending = true;
  }

  const useZoneFallback = !hasCredentials || !latestSat;

  return NextResponse.json({
    fieldId: id,
    zoneId: zoneId ?? null,
    metrics: {
      ndvi: latestSat?.ndvi ?? (useZoneFallback ? avgNdvi : null),
      ndmi: latestSat?.ndmi ?? (useZoneFallback ? avgNdmi : null),
      ndre: latestSat?.ndre ?? null,
      temperature:
        weatherHistory[0]?.temp ??
        (s3Lst ??
          (useZoneFallback
            ? zones.reduce((s, z) => s + z.temperatureAverage, 0) / zones.length
            : null)),
      soilMoisture:
        soilFromWeather ??
        (s1MoistureIndex != null ? Math.round(s1MoistureIndex * 100) : null) ??
        (useZoneFallback
          ? zones.reduce((s, z) => s + z.soilMoistureAverage, 0) / zones.length
          : null),
      s1MoistureIndex,
      s3Lst,
      cloudCover,
      sceneDate,
    },
    ndviGrid: latestGrid,
    missions,
    satelliteHistory,
    weatherHistory,
    source: dataSource,
    satelliteSource: latestSat?.source ?? (hasCredentials ? 'pending' : 'mock'),
    satellitePending,
  });
}
