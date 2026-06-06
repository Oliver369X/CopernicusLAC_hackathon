import { NextResponse } from 'next/server';
import { getFieldByIdFromDb } from '@/lib/data/fields';
import { getFieldById } from '@/lib/mock-data/fields';
import { getDbService } from '@/lib/db/get-service';
import {
  getSatelliteReadingForZoneOnDate,
  getNearestReadingOnOrBefore,
  listAvailableReadingDates,
  getSatelliteReadingsForZoneRange,
} from '@/lib/data/zone-satellite-metrics';
import { hasSatelliteCredentialsConfigured } from '@/lib/config/satellite';

interface SatelliteRow {
  captured_at: string;
  reading_date?: string;
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
  const asOf = searchParams.get('asOf') ?? undefined;

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
  let availableDates: string[] = [];
  let readingDate: string | null = null;

  const service = await getDbService();
  const primaryZone = zones[0];

  if (service && primaryZone) {
    availableDates = await listAvailableReadingDates(service, primaryZone.id);

    let snapshot = null;
    if (asOf) {
      snapshot = await getSatelliteReadingForZoneOnDate(service, primaryZone.id, asOf);
      if (!snapshot) {
        snapshot = await getNearestReadingOnOrBefore(service, primaryZone.id, asOf);
      }
    } else if (availableDates.length > 0) {
      snapshot = await getSatelliteReadingForZoneOnDate(
        service,
        primaryZone.id,
        availableDates[0]
      );
    }

    if (snapshot) {
      dataSource = 'database';
      readingDate = snapshot.readingDate ?? availableDates[0] ?? null;
      sceneDate = snapshot.sceneDate;
      cloudCover = snapshot.cloudCover;
      s1MoistureIndex = snapshot.s1MoistureIndex;
      s3Lst = snapshot.s3Lst;
      latestGrid = snapshot.ndviGrid;

      const rangeEnd = readingDate ?? new Date().toISOString().split('T')[0];
      const rangeStart = new Date(`${rangeEnd}T12:00:00Z`);
      rangeStart.setUTCDate(rangeStart.getUTCDate() - 30);
      const history = await getSatelliteReadingsForZoneRange(
        service,
        primaryZone.id,
        rangeStart.toISOString().split('T')[0],
        rangeEnd
      );

      satelliteHistory = history.map((h) => ({
        captured_at: h.captured_at,
        reading_date: h.reading_date,
        ndvi: h.ndvi,
        ndmi: h.ndmi,
        ndre: h.ndre,
        zone_id: primaryZone.id,
        source: 'copernicus',
        scene_date: sceneDate,
      }));
    }

    const { data: weather } = await service
      .from('weather_readings')
      .select('captured_at, temp, humidity, soil_moisture')
      .eq('field_id', id)
      .order('captured_at', { ascending: false })
      .limit(30);

    if (weather?.length) {
      weatherHistory = weather as typeof weatherHistory;
    }
  }

  const latestSat = satelliteHistory[satelliteHistory.length - 1] ?? satelliteHistory[0];
  const soilFromWeather = weatherHistory[0]?.soil_moisture;
  const hasCredentials = hasSatelliteCredentialsConfigured();

  if (hasCredentials && !latestSat) {
    satellitePending = true;
  }

  const useZoneFallback = !latestSat;

  return NextResponse.json({
    fieldId: id,
    zoneId: zoneId ?? null,
    readingDate,
    availableDates,
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
    metricsSource: dataSource,
    satelliteSource: latestSat?.source ?? (hasCredentials ? 'pending' : 'mock'),
    satellitePending,
  });
}
