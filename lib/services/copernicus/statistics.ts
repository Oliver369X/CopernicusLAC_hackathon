import type { GeoBounds, GeoPoint } from '@/lib/types/field';
import { boundsToBbox, normalizeGeoBounds, timeRangeLastDays } from './bounds';
import { cdseFetch } from './client';

const WGS84_CRS = 'http://www.opengis.net/def/crs/EPSG/0/4326';
/** ~10 m sampling in degrees (Statistical API requires resx/resy in CRS units). */
const STATS_RES_DEG = 0.0001;
import {
  S1_EXTENDED_STATS_EVALSCRIPT,
  S1_STATS_EVALSCRIPT,
  S2_EXTENDED_STATS_EVALSCRIPT,
  S2_STATS_EVALSCRIPT,
  S3_LST_EVALSCRIPT,
} from './evalscripts';

interface StatsOutput {
  mean?: number;
  stDev?: number;
  sampleCount?: number;
  noDataCount?: number;
}

interface StatsInterval {
  interval: { from: string; to: string };
  outputs: Record<string, { bands: { stats: StatsOutput }[] }>;
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

function extractMean(
  response: StatsResponse,
  outputId: string,
  bandIndex = 0
): number | null {
  const intervals = response.data ?? [];
  for (let i = intervals.length - 1; i >= 0; i--) {
    const band = bandStats(
      intervals[i]?.outputs?.[outputId]?.bands as
        | StatsOutput[]
        | Record<string, { stats?: StatsOutput }>
        | undefined,
      bandIndex
    );
    if (band?.mean != null && !Number.isNaN(band.mean) && band.sampleCount) {
      return band.mean;
    }
  }
  return null;
}

async function fetchStatistics(
  bounds: GeoBounds | unknown,
  dataType: string,
  evalscript: string,
  maxCloudCoverage?: number,
  fallbackCenter?: GeoPoint,
  extraFilter?: Record<string, unknown>,
  aggregationDays: 'P1D' | 'P5D' = 'P1D'
): Promise<StatsResponse | null> {
  const normalized = normalizeGeoBounds(bounds, fallbackCenter);
  const bbox = boundsToBbox(normalized);
  const timeRange = timeRangeLastDays(30);
  const dataFilter: Record<string, unknown> = {
    timeRange,
    mosaickingOrder: 'leastCC',
    ...extraFilter,
  };
  if (maxCloudCoverage != null) {
    dataFilter.maxCloudCoverage = maxCloudCoverage;
  }

  const body = {
    input: {
      bounds: {
        bbox,
        properties: { crs: WGS84_CRS },
      },
      data: [{ type: dataType, dataFilter }],
    },
    aggregation: {
      timeRange,
      aggregationInterval: { of: aggregationDays },
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

    if (!res.ok) {
      if (process.env.NODE_ENV === 'development') {
        const detail = await res.text().catch(() => '');
        console.warn(
          `[CDSE statistics] ${dataType} HTTP ${res.status}:`,
          detail.slice(0, 400)
        );
      }
      return null;
    }
    return (await res.json()) as StatsResponse;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[CDSE statistics] ${dataType} error:`, err);
    }
    return null;
  }
}

export interface S2Statistics {
  ndvi: number | null;
  ndmi: number | null;
  ndre: number | null;
  sceneDate: string | null;
  cloudCover: number | null;
}

export interface S2ExtendedStatistics extends S2Statistics {
  evi: number | null;
  savi: number | null;
  ndwi: number | null;
  msi: number | null;
  ciRedEdge: number | null;
  redsi: number | null;
}

export async function fetchS2ExtendedStatistics(
  bounds: GeoBounds | unknown,
  fallbackCenter?: GeoPoint
): Promise<S2ExtendedStatistics> {
  const response = await fetchStatistics(
    bounds,
    'sentinel-2-l2a',
    S2_EXTENDED_STATS_EVALSCRIPT,
    40,
    fallbackCenter
  );

  if (!response) {
    return {
      ndvi: null,
      ndmi: null,
      ndre: null,
      sceneDate: null,
      cloudCover: null,
      evi: null,
      savi: null,
      ndwi: null,
      msi: null,
      ciRedEdge: null,
      redsi: null,
    };
  }

  const lastInterval = response.data?.[response.data.length - 1];
  const ndviBand = bandStats(
    lastInterval?.outputs?.ndvi?.bands as
      | StatsOutput[]
      | Record<string, { stats?: StatsOutput }>
      | undefined
  );
  const ndviNoData = ndviBand?.noDataCount ?? 0;
  const ndviSamples = ndviBand?.sampleCount ?? 0;
  const cloudCover =
    ndviSamples + ndviNoData > 0
      ? Math.round((ndviNoData / (ndviSamples + ndviNoData)) * 100)
      : null;

  return {
    ndvi: extractMean(response, 'ndvi'),
    ndmi: extractMean(response, 'ndmi'),
    ndre: extractMean(response, 'ndre'),
    evi: extractMean(response, 'evi'),
    savi: extractMean(response, 'savi'),
    ndwi: extractMean(response, 'ndwi'),
    msi: extractMean(response, 'msi'),
    ciRedEdge: extractMean(response, 'cired'),
    redsi: extractMean(response, 'redsi'),
    sceneDate: lastInterval?.interval?.to ?? null,
    cloudCover,
  };
}

export interface S1ExtendedStatistics extends S1Statistics {
  rvi: number | null;
  dpRvi: number | null;
}

export async function fetchS1ExtendedStatistics(
  bounds: GeoBounds | unknown,
  fallbackCenter?: GeoPoint
): Promise<S1ExtendedStatistics> {
  const response = await fetchStatistics(
    bounds,
    'sentinel-1-grd',
    S1_EXTENDED_STATS_EVALSCRIPT,
    undefined,
    fallbackCenter,
    { polarization: 'DV', acquisitionMode: 'IW', mosaickingOrder: 'leastRecent' },
    'P5D'
  );

  if (!response) {
    return { vh: null, vv: null, moistureIndex: null, rvi: null, dpRvi: null };
  }

  return {
    vh: extractMean(response, 'vh'),
    vv: extractMean(response, 'vv'),
    moistureIndex: extractMean(response, 'moisture'),
    rvi: extractMean(response, 'rvi'),
    dpRvi: extractMean(response, 'dprvi'),
  };
}

export async function fetchS2Statistics(
  bounds: GeoBounds | unknown,
  fallbackCenter?: GeoPoint
): Promise<S2Statistics> {
  const response = await fetchStatistics(
    bounds,
    'sentinel-2-l2a',
    S2_STATS_EVALSCRIPT,
    40,
    fallbackCenter
  );

  if (!response) {
    return { ndvi: null, ndmi: null, ndre: null, sceneDate: null, cloudCover: null };
  }

  const lastInterval = response.data?.[response.data.length - 1];
  const ndviBand = bandStats(
    lastInterval?.outputs?.ndvi?.bands as
      | StatsOutput[]
      | Record<string, { stats?: StatsOutput }>
      | undefined
  );
  const ndviNoData = ndviBand?.noDataCount ?? 0;
  const ndviSamples = ndviBand?.sampleCount ?? 0;
  const cloudCover =
    ndviSamples + ndviNoData > 0
      ? Math.round((ndviNoData / (ndviSamples + ndviNoData)) * 100)
      : null;

  return {
    ndvi: extractMean(response, 'ndvi'),
    ndmi: extractMean(response, 'ndmi'),
    ndre: extractMean(response, 'ndre'),
    sceneDate: lastInterval?.interval?.to ?? null,
    cloudCover,
  };
}

export interface S1Statistics {
  vh: number | null;
  vv: number | null;
  moistureIndex: number | null;
}

export async function fetchS1Statistics(
  bounds: GeoBounds | unknown,
  fallbackCenter?: GeoPoint
): Promise<S1Statistics> {
  const response = await fetchStatistics(
    bounds,
    'sentinel-1-grd',
    S1_STATS_EVALSCRIPT,
    undefined,
    fallbackCenter,
    { polarization: 'DV', acquisitionMode: 'IW', mosaickingOrder: 'leastRecent' },
    'P5D'
  );

  if (!response) {
    return { vh: null, vv: null, moistureIndex: null };
  }

  const vh = extractMean(response, 'vh');
  const vv = extractMean(response, 'vv');
  const moistureIndex =
    extractMean(response, 'moisture') ?? (vh != null && vv ? vh / vv : null);

  return { vh, vv, moistureIndex };
}

export interface S3Statistics {
  lst: number | null;
  sceneDate: string | null;
}

export async function fetchS3Statistics(
  bounds: GeoBounds | unknown,
  fallbackCenter?: GeoPoint
): Promise<S3Statistics> {
  const response = await fetchStatistics(
    bounds,
    'sentinel-3-slstr',
    S3_LST_EVALSCRIPT,
    undefined,
    fallbackCenter,
    { orbitDirection: 'DESCENDING' }
  );

  if (!response) {
    return { lst: null, sceneDate: null };
  }

  const lastInterval = response.data?.[response.data.length - 1];
  return {
    lst: extractMean(response, 'lst'),
    sceneDate: lastInterval?.interval?.to ?? null,
  };
}
