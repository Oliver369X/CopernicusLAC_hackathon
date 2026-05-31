import type { FieldZone, GeoPoint } from '@/lib/types/field';
import { boundsCentroid, normalizeGeoBounds } from '../copernicus/bounds';
import {
  hasCopernicusCredentials,
  hasSentinelHubCredentials,
} from '../copernicus/auth';
import { getProviderConfig } from '../copernicus/client';
import { fetchS2NdviGrid, type NdviGridPayload } from '../copernicus/process';
import {
  fetchS1Statistics,
  fetchS2Statistics,
  fetchS3Statistics,
} from '../copernicus/statistics';
import { fetchSatelliteMetricsLegacy } from '../sentinel-hub-legacy';

export type SatelliteSource =
  | 'copernicus'
  | 'sentinel_hub'
  | 'mock';

export interface NdviGridData {
  size: number;
  ndvi: number[][];
  ndmi: number[][];
  min: number;
  max: number;
}

export interface ZoneSatelliteReading {
  ndvi: number;
  ndmi: number;
  ndre: number | null;
  s1Vh: number | null;
  s1Vv: number | null;
  s1MoistureIndex: number | null;
  s3Lst: number | null;
  cloudCover: number | null;
  sceneDate: string | null;
  ndviGrid: NdviGridData | null;
  source: SatelliteSource;
  missions: string[];
  capturedAt: string;
  rawMetadata: Record<string, unknown>;
}

export function hasSatelliteCredentials(): boolean {
  return hasCopernicusCredentials() || hasSentinelHubCredentials();
}

export async function fetchZoneSatelliteReading(
  zone: FieldZone,
  fieldCenter?: GeoPoint
): Promise<ZoneSatelliteReading> {
  const fallbackNdvi = zone.ndviAverage;
  const fallbackNdmi = zone.ndmiAverage;
  const capturedAt = new Date().toISOString();
  const center =
    fieldCenter ??
    boundsCentroid(normalizeGeoBounds(zone.bounds, fieldCenter));

  const { token, backend } = await getProviderConfig();

  if (!token) {
    const legacy = await fetchSatelliteMetricsLegacy(
      zone.bounds,
      fallbackNdvi,
      fallbackNdmi
    );
    return {
      ndvi: legacy.ndvi,
      ndmi: legacy.ndmi,
      ndre: null,
      s1Vh: null,
      s1Vv: null,
      s1MoistureIndex: null,
      s3Lst: null,
      cloudCover: null,
      sceneDate: null,
      ndviGrid: null,
      source: 'mock',
      missions: [],
      capturedAt: legacy.capturedAt,
      rawMetadata: legacy.rawMetadata ?? { reason: 'no_credentials' },
    };
  }

  const [s2Result, s1Result, s3Result, gridResult] = await Promise.allSettled([
    fetchS2Statistics(zone.bounds, center),
    fetchS1Statistics(zone.bounds, center),
    fetchS3Statistics(zone.bounds, center),
    fetchS2NdviGrid(zone.bounds),
  ]);

  const s2 = s2Result.status === 'fulfilled' ? s2Result.value : null;
  const s1 = s1Result.status === 'fulfilled' ? s1Result.value : null;
  const s3 = s3Result.status === 'fulfilled' ? s3Result.value : null;
  const grid: NdviGridPayload | null =
    gridResult.status === 'fulfilled' ? gridResult.value : null;

  const ndvi = s2?.ndvi ?? fallbackNdvi;
  const ndmi = s2?.ndmi ?? fallbackNdmi;
  const ndre = s2?.ndre ?? null;
  const missions: string[] = [];
  if (s2?.ndvi != null) missions.push('sentinel-2');
  if (s1?.moistureIndex != null) missions.push('sentinel-1');
  if (s3?.lst != null) missions.push('sentinel-3');

  const hasRealData = missions.length > 0;

  return {
    ndvi,
    ndmi,
    ndre,
    s1Vh: s1?.vh ?? null,
    s1Vv: s1?.vv ?? null,
    s1MoistureIndex: s1?.moistureIndex ?? null,
    s3Lst: s3?.lst ?? null,
    cloudCover: s2?.cloudCover ?? null,
    sceneDate: s2?.sceneDate ?? s3?.sceneDate ?? null,
    ndviGrid: grid,
    source: hasRealData ? backend : 'mock',
    missions,
    capturedAt,
    rawMetadata: {
      backend,
      s2,
      s1,
      s3,
      hasGrid: Boolean(grid),
    },
  };
}

/** @deprecated Use fetchZoneSatelliteReading */
export async function fetchSatelliteMetrics(
  bounds: FieldZone['bounds'],
  fallbackNdvi = 0.55,
  fallbackNdmi = 0.4
) {
  const reading = await fetchZoneSatelliteReading({
    id: 'legacy',
    name: 'legacy',
    fieldId: 'legacy',
    area: 0,
    bounds,
    crop: 'soybean',
    health: 'good',
    ndviAverage: fallbackNdvi,
    ndmiAverage: fallbackNdmi,
    temperatureAverage: 20,
    soilMoistureAverage: 60,
    observationCount: 0,
    diseaseRisks: [],
    lastObservation: new Date(),
    lastUpdate: new Date(),
  });

  return {
    ndvi: reading.ndvi,
    ndmi: reading.ndmi,
    source: reading.source === 'mock' ? ('mock' as const) : ('sentinel' as const),
    capturedAt: reading.capturedAt,
    rawMetadata: reading.rawMetadata,
  };
}
