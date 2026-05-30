import type { GeoBounds } from '@/lib/types/field';
import { boundsToPolygon, timeRangeLastDays } from './bounds';
import { cdseFetch } from './client';
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

function extractMean(
  response: StatsResponse,
  outputId: string,
  bandIndex = 0
): number | null {
  const intervals = response.data ?? [];
  for (let i = intervals.length - 1; i >= 0; i--) {
    const band = intervals[i]?.outputs?.[outputId]?.bands?.[bandIndex]?.stats;
    if (band?.mean != null && !Number.isNaN(band.mean) && band.sampleCount) {
      return band.mean;
    }
  }
  return null;
}

async function fetchStatistics(
  bounds: GeoBounds,
  dataType: string,
  evalscript: string,
  outputIds: string[],
  maxCloudCoverage?: number
): Promise<StatsResponse | null> {
  const timeRange = timeRangeLastDays(30);
  const dataFilter: Record<string, unknown> = { timeRange };
  if (maxCloudCoverage != null) {
    dataFilter.maxCloudCoverage = maxCloudCoverage;
  }

  const body = {
    input: {
      bounds: {
        geometry: {
          type: 'Polygon',
          coordinates: [boundsToPolygon(bounds)],
        },
      },
      data: [{ type: dataType, dataFilter }],
    },
    aggregation: {
      timeRange,
      aggregationInterval: { of: 'P1D' },
      evalscript,
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
  bounds: GeoBounds
): Promise<S2ExtendedStatistics> {
  const response = await fetchStatistics(
    bounds,
    'sentinel-2-l2a',
    S2_EXTENDED_STATS_EVALSCRIPT,
    ['ndvi', 'ndmi', 'ndre', 'evi', 'savi', 'ndwi', 'msi', 'cired', 'redsi'],
    20
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
  const ndviNoData = lastInterval?.outputs?.ndvi?.bands?.[0]?.stats?.noDataCount ?? 0;
  const ndviSamples = lastInterval?.outputs?.ndvi?.bands?.[0]?.stats?.sampleCount ?? 0;
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
  bounds: GeoBounds
): Promise<S1ExtendedStatistics> {
  const response = await fetchStatistics(
    bounds,
    'sentinel-1-grd',
    S1_EXTENDED_STATS_EVALSCRIPT,
    ['vh', 'vv', 'moisture', 'rvi', 'dprvi']
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

export async function fetchS2Statistics(bounds: GeoBounds): Promise<S2Statistics> {
  const response = await fetchStatistics(
    bounds,
    'sentinel-2-l2a',
    S2_STATS_EVALSCRIPT,
    ['ndvi', 'ndmi', 'ndre'],
    20
  );

  if (!response) {
    return { ndvi: null, ndmi: null, ndre: null, sceneDate: null, cloudCover: null };
  }

  const lastInterval = response.data?.[response.data.length - 1];
  const ndviNoData = lastInterval?.outputs?.ndvi?.bands?.[0]?.stats?.noDataCount ?? 0;
  const ndviSamples = lastInterval?.outputs?.ndvi?.bands?.[0]?.stats?.sampleCount ?? 0;
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

export async function fetchS1Statistics(bounds: GeoBounds): Promise<S1Statistics> {
  const response = await fetchStatistics(
    bounds,
    'sentinel-1-grd',
    S1_STATS_EVALSCRIPT,
    ['vh', 'vv', 'moisture']
  );

  if (!response) {
    return { vh: null, vv: null, moistureIndex: null };
  }

  return {
    vh: extractMean(response, 'vh'),
    vv: extractMean(response, 'vv'),
    moistureIndex: extractMean(response, 'moisture'),
  };
}

export interface S3Statistics {
  lst: number | null;
  sceneDate: string | null;
}

export async function fetchS3Statistics(bounds: GeoBounds): Promise<S3Statistics> {
  const response = await fetchStatistics(
    bounds,
    'sentinel-3-slstr',
    S3_LST_EVALSCRIPT,
    ['lst']
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
