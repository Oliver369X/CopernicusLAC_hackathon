import type { SatelliteData } from '@/lib/mock-data/satellite-data';
import { generateSatelliteData, getAverageValue } from '@/lib/mock-data/satellite-data';
import { coerceMetricNumber, formatDecimal } from '@/lib/i18n/format-number';
import {
  hasSatelliteCredentialsConfigured,
  isSatelliteStrictMode,
} from '@/lib/config/satellite';

export interface FieldMetrics {
  ndvi: number;
  ndmi: number;
  ndre?: number | null;
  temperature: number;
  soilMoisture: number;
  s1MoistureIndex?: number | null;
  s3Lst?: number | null;
  cloudCover?: number | null;
  sceneDate?: string | null;
}

export interface NdviGridPayload {
  size: number;
  ndvi: number[][];
  ndmi: number[][];
  min: number;
  max: number;
}

export interface MetricsHistoryPoint {
  captured_at: string;
  ndvi?: number;
  ndmi?: number;
  temp?: number;
  humidity?: number;
}

export interface BuildSatelliteDataOptions {
  satelliteSource?: string;
  allowSyntheticGrid?: boolean;
}

function scaleGridToTarget(grid: number[][], target: number): number[][] {
  const current = getAverageValue(grid);
  const offset = target - current;
  return grid.map((row) => row.map((v) => Math.max(-1, Math.min(1, v + offset))));
}

function scaleGridToTargetUnbounded(grid: number[][], target: number): number[][] {
  const current = getAverageValue(grid);
  const offset = target - current;
  return grid.map((row) => row.map((v) => v + offset));
}

function emptyScalarGrid(size: number, value: number): number[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => value));
}

/** Build heatmap from real Copernicus grid; synthetic only when explicitly allowed. */
function normalizeFieldMetrics(metrics: FieldMetrics): FieldMetrics {
  return {
    ndvi: coerceMetricNumber(metrics.ndvi, 0),
    ndmi: coerceMetricNumber(metrics.ndmi, 0),
    ndre: metrics.ndre != null ? coerceMetricNumber(metrics.ndre, 0) : null,
    temperature: coerceMetricNumber(metrics.temperature, 0),
    soilMoisture: coerceMetricNumber(metrics.soilMoisture, 0),
    s1MoistureIndex:
      metrics.s1MoistureIndex != null
        ? coerceMetricNumber(metrics.s1MoistureIndex, 0)
        : null,
    s3Lst: metrics.s3Lst != null ? coerceMetricNumber(metrics.s3Lst, 0) : null,
    cloudCover:
      metrics.cloudCover != null ? coerceMetricNumber(metrics.cloudCover, 0) : null,
    sceneDate: metrics.sceneDate ?? null,
  };
}

export function buildSatelliteDataFromMetrics(
  fieldId: string,
  metrics: FieldMetrics,
  gridSize = 30,
  realGrid?: NdviGridPayload | null,
  options?: BuildSatelliteDataOptions
): SatelliteData {
  const m = normalizeFieldMetrics(metrics);
  const satelliteSource = options?.satelliteSource ?? 'mock';
  const strict =
    isSatelliteStrictMode() ||
    (hasSatelliteCredentialsConfigured() && satelliteSource === 'copernicus');
  const allowSynthetic =
    options?.allowSyntheticGrid ?? !strict;

  if (realGrid?.ndvi?.length) {
    const timestamp = m.sceneDate ?? new Date().toISOString();
    return {
      fieldId,
      date: new Date(timestamp),
      ndvi: realGrid.ndvi,
      ndmi: realGrid.ndmi,
      temperature: scaleGridToTargetUnbounded(
        realGrid.ndvi.map((row) => row.map(() => m.temperature)),
        m.temperature
      ),
      soilMoisture: scaleGridToTargetUnbounded(
        realGrid.ndvi.map((row) => row.map(() => m.soilMoisture)),
        m.soilMoisture
      ),
      cloudCover: m.cloudCover ?? 0,
      timestamp,
      isRealGrid: true,
      gridPending: false,
    };
  }

  if (!allowSynthetic) {
    const timestamp = m.sceneDate ?? new Date().toISOString();
    return {
      fieldId,
      date: new Date(timestamp),
      ndvi: emptyScalarGrid(gridSize, m.ndvi),
      ndmi: emptyScalarGrid(gridSize, m.ndmi),
      temperature: emptyScalarGrid(gridSize, m.temperature),
      soilMoisture: emptyScalarGrid(gridSize, m.soilMoisture),
      cloudCover: m.cloudCover ?? 0,
      timestamp,
      isRealGrid: false,
      gridPending: satelliteSource === 'copernicus',
    };
  }

  const base = generateSatelliteData(fieldId, new Date(), gridSize);

  return {
    ...base,
    ndvi: scaleGridToTarget(base.ndvi, m.ndvi),
    ndmi: scaleGridToTarget(base.ndmi, m.ndmi),
    temperature: scaleGridToTargetUnbounded(base.temperature, m.temperature),
    soilMoisture: scaleGridToTargetUnbounded(base.soilMoisture, m.soilMoisture),
    cloudCover: m.cloudCover ?? base.cloudCover,
    isRealGrid: false,
    gridPending: false,
  };
}

export function metricsFromZone(zone: {
  ndviAverage: number;
  ndmiAverage: number;
  temperatureAverage: number;
  soilMoistureAverage: number;
}): FieldMetrics {
  return normalizeFieldMetrics({
    ndvi: zone.ndviAverage,
    ndmi: zone.ndmiAverage,
    temperature: zone.temperatureAverage,
    soilMoisture: zone.soilMoistureAverage,
  });
}

export interface TrendFromHistoryResult {
  points: Array<{ date: string; ndvi: string; ndmi: string }>;
  synthetic: boolean;
}

export function buildTrendFromHistory(
  history: MetricsHistoryPoint[],
  fallbackNdvi: number,
  fallbackNdmi: number
): TrendFromHistoryResult {
  if (!history.length) {
    if (isSatelliteStrictMode() || hasSatelliteCredentialsConfigured()) {
      return { points: [], synthetic: false };
    }
    return {
      points: Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return {
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          ndvi: formatDecimal(fallbackNdvi, 2),
          ndmi: formatDecimal(fallbackNdmi, 2),
        };
      }),
      synthetic: true,
    };
  }

  return {
    points: [...history]
      .reverse()
      .slice(-14)
      .map((point) => ({
        date: new Date(point.captured_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        ndvi: formatDecimal(point.ndvi ?? fallbackNdvi, 2),
        ndmi: formatDecimal(point.ndmi ?? fallbackNdmi, 2),
      })),
    synthetic: false,
  };
}
