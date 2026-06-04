import type { GeoBounds, GeoPoint } from '@/lib/types/field';
import { boundsToBbox, normalizeGeoBounds, timeRangeLastDays } from './bounds';
import { cdseFetch } from './client';
import {
  S1_STATS_EVALSCRIPT,
  S2_STATS_EVALSCRIPT,
  S3_LST_EVALSCRIPT,
} from './evalscripts';

const WGS84_CRS = 'http://www.opengis.net/def/crs/EPSG/0/4326';
const STATS_RES_DEG = 0.0001;

interface StatsOutput {
  mean?: number;
  stDev?: number;
  sampleCount?: number;
  noDataCount?: number;
}

interface StatsInterval {
  interval: { from: string; to: string };
  outputs: Record<string, { bands: StatsOutput[] | Record<string, { stats?: StatsOutput }> }>;
}

interface StatsResponse {
  data?: StatsInterval[];
  status?: string;
}

type BandEntry = StatsOutput | { stats?: StatsOutput };

function bandStats(
  bands: BandEntry[] | Record<string, BandEntry> | undefined,
  bandIndex = 0
): StatsOutput | undefined {
  if (!bands) return undefined;
  if (Array.isArray(bands)) {
    const entry = bands[bandIndex];
    if (!entry) return undefined;
    if (entry && typeof entry === 'object' && 'stats' in entry && entry.stats) {
      return entry.stats;
    }
    return entry as StatsOutput;
  }
  const keys = Object.keys(bands);
  const key = keys[bandIndex] ?? keys[0];
  if (!key) return undefined;
  const entry = bands[key];
  return entry && 'stats' in entry ? entry.stats : (entry as StatsOutput);
}

function extractMeanFromInterval(
  interval: StatsInterval,
  outputId: string,
  bandIndex = 0
): number | null {
  const band = bandStats(
    interval.outputs?.[outputId]?.bands as
      | StatsOutput[]
      | Record<string, { stats?: StatsOutput }>
      | undefined,
    bandIndex
  );
  if (band?.mean != null && !Number.isNaN(band.mean) && band.sampleCount) {
    return band.mean;
  }
  return null;
}

function cloudCoverFromNdviBand(interval: StatsInterval): number | null {
  const band = bandStats(
    interval.outputs?.ndvi?.bands as
      | StatsOutput[]
      | Record<string, { stats?: StatsOutput }>
      | undefined
  );
  const noData = band?.noDataCount ?? 0;
  const samples = band?.sampleCount ?? 0;
  if (samples + noData === 0) return null;
  return Math.round((noData / (samples + noData)) * 100);
}

async function fetchStatisticsSeries(
  bounds: GeoBounds | unknown,
  dataType: string,
  evalscript: string,
  days: number,
  fallbackCenter?: GeoPoint,
  options?: {
    maxCloudCoverage?: number;
    extraFilter?: Record<string, unknown>;
    aggregationDays?: 'P1D' | 'P5D' | 'P7D';
  }
): Promise<StatsResponse | null> {
  const normalized = normalizeGeoBounds(bounds, fallbackCenter);
  const bbox = boundsToBbox(normalized);
  const timeRange = timeRangeLastDays(days);
  const dataFilter: Record<string, unknown> = {
    timeRange,
    mosaickingOrder: 'leastCC',
    ...options?.extraFilter,
  };
  if (options?.maxCloudCoverage != null) {
    dataFilter.maxCloudCoverage = options.maxCloudCoverage;
  }

  const body = {
    input: {
      bounds: { bbox, properties: { crs: WGS84_CRS } },
      data: [{ type: dataType, dataFilter }],
    },
    aggregation: {
      timeRange,
      aggregationInterval: { of: options?.aggregationDays ?? 'P7D' },
      evalscript,
      resx: STATS_RES_DEG,
      resy: STATS_RES_DEG,
    },
  };

  try {
    const res = await cdseFetch('/api/v1/statistics', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as StatsResponse;
  } catch {
    return null;
  }
}

export interface SatelliteHistoryPoint {
  sceneDate: string;
  readingDate: string;
  ndvi: number | null;
  ndmi: number | null;
  ndre: number | null;
  cloudCover: number | null;
  s1Vv: number | null;
  s1Vh: number | null;
  s1MoistureIndex: number | null;
  s3Lst: number | null;
}

function readingDateFromIso(iso: string): string {
  return iso.split('T')[0];
}

/** Historical S2 (+ optional S1/S3) intervals from CDSE Statistical API for backfill. */
export async function fetchZoneSatelliteHistory(
  bounds: GeoBounds | unknown,
  days: number,
  fallbackCenter?: GeoPoint
): Promise<SatelliteHistoryPoint[]> {
  const [s2Response, s1Response, s3Response] = await Promise.all([
    fetchStatisticsSeries(bounds, 'sentinel-2-l2a', S2_STATS_EVALSCRIPT, days, fallbackCenter, {
      maxCloudCoverage: 40,
      aggregationDays: 'P7D',
    }),
    fetchStatisticsSeries(bounds, 'sentinel-1-grd', S1_STATS_EVALSCRIPT, days, fallbackCenter, {
      extraFilter: {
        polarization: 'DV',
        acquisitionMode: 'IW',
        mosaickingOrder: 'leastRecent',
      },
      aggregationDays: 'P5D',
    }),
    fetchStatisticsSeries(bounds, 'sentinel-3-slstr', S3_LST_EVALSCRIPT, days, fallbackCenter, {
      extraFilter: { orbitDirection: 'DESCENDING' },
      aggregationDays: 'P7D',
    }),
  ]);

  const s2Intervals = s2Response?.data ?? [];
  const s1ByDate = new Map<string, StatsInterval>();
  for (const interval of s1Response?.data ?? []) {
    s1ByDate.set(readingDateFromIso(interval.interval.to), interval);
  }
  const s3ByDate = new Map<string, StatsInterval>();
  for (const interval of s3Response?.data ?? []) {
    s3ByDate.set(readingDateFromIso(interval.interval.to), interval);
  }

  const points: SatelliteHistoryPoint[] = [];

  for (const interval of s2Intervals) {
    const ndvi = extractMeanFromInterval(interval, 'ndvi');
    if (ndvi == null) continue;

    const sceneDate = interval.interval.to;
    const readingDate = readingDateFromIso(sceneDate);
    const s1 = s1ByDate.get(readingDate);
    const s3 = s3ByDate.get(readingDate);
    const vv = s1 ? extractMeanFromInterval(s1, 'vv') : null;
    const vh = s1 ? extractMeanFromInterval(s1, 'vh') : null;
    const moisture =
      (s1 ? extractMeanFromInterval(s1, 'moisture') : null) ??
      (vv != null && vh ? vv / vh : null);

    points.push({
      sceneDate,
      readingDate,
      ndvi,
      ndmi: extractMeanFromInterval(interval, 'ndmi'),
      ndre: extractMeanFromInterval(interval, 'ndre'),
      cloudCover: cloudCoverFromNdviBand(interval),
      s1Vv: vv,
      s1Vh: vh,
      s1MoistureIndex: moisture,
      s3Lst: s3 ? extractMeanFromInterval(s3, 'lst') : null,
    });
  }

  return points.sort((a, b) => a.readingDate.localeCompare(b.readingDate));
}
