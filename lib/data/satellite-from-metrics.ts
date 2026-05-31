import type { SatelliteData } from '@/lib/mock-data/satellite-data';
import { generateSatelliteData, getAverageValue } from '@/lib/mock-data/satellite-data';

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

/** Build heatmap from real Copernicus grid or synthetic fallback anchored to metrics. */
export function buildSatelliteDataFromMetrics(
  fieldId: string,
  metrics: FieldMetrics,
  gridSize = 30,
  realGrid?: NdviGridPayload | null
): SatelliteData {
  if (realGrid?.ndvi?.length) {
    const timestamp = metrics.sceneDate ?? new Date().toISOString();
    return {
      fieldId,
      date: new Date(timestamp),
      ndvi: realGrid.ndvi,
      ndmi: realGrid.ndmi,
      temperature: scaleGridToTargetUnbounded(
        realGrid.ndvi.map((row) => row.map(() => metrics.temperature)),
        metrics.temperature
      ),
      soilMoisture: scaleGridToTargetUnbounded(
        realGrid.ndvi.map((row) => row.map(() => metrics.soilMoisture)),
        metrics.soilMoisture
      ),
      cloudCover: metrics.cloudCover ?? 0,
      timestamp,
      isRealGrid: true,
    };
  }

  const base = generateSatelliteData(fieldId, new Date(), gridSize);

  return {
    ...base,
    ndvi: scaleGridToTarget(base.ndvi, metrics.ndvi),
    ndmi: scaleGridToTarget(base.ndmi, metrics.ndmi),
    temperature: scaleGridToTargetUnbounded(base.temperature, metrics.temperature),
    soilMoisture: scaleGridToTargetUnbounded(base.soilMoisture, metrics.soilMoisture),
    isRealGrid: false,
  };
}

export function metricsFromZone(zone: {
  ndviAverage: number;
  ndmiAverage: number;
  temperatureAverage: number;
  soilMoistureAverage: number;
}): FieldMetrics {
  return {
    ndvi: zone.ndviAverage,
    ndmi: zone.ndmiAverage,
    temperature: zone.temperatureAverage,
    soilMoisture: zone.soilMoistureAverage,
  };
}

export function buildTrendFromHistory(
  history: MetricsHistoryPoint[],
  fallbackNdvi: number,
  fallbackNdmi: number
): Array<{ date: string; ndvi: string; ndmi: string }> {
  if (!history.length) {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ndvi: fallbackNdvi.toFixed(2),
        ndmi: fallbackNdmi.toFixed(2),
      };
    });
  }

  return [...history]
    .reverse()
    .slice(-14)
    .map((point) => ({
      date: new Date(point.captured_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      ndvi: (point.ndvi ?? fallbackNdvi).toFixed(2),
      ndmi: (point.ndmi ?? fallbackNdmi).toFixed(2),
    }));
}
