import type { CropScienceProfile, ScienceCropId, TemporalSignature } from '../types';
import { detectParcelOutlier } from './outlier-detector';
import type { ZoneHistoryPoint } from '@/lib/data/zone-satellite-metrics';

export interface TimeSeriesPoint {
  capturedAt: string;
  ndvi: number;
  ndre?: number | null;
  dpRvi?: number | null;
}

function slope(values: number[]): number | null {
  if (values.length < 2) return null;
  return (values[values.length - 1] - values[0]) / values.length;
}

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / (86400000);
}

export function buildTemporalSignature(
  history: TimeSeriesPoint[],
  daysFromPlanting: number,
  profile: CropScienceProfile
): TemporalSignature {
  const sorted = [...history].sort(
    (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
  );

  const ndviSeries = sorted.map((p) => p.ndvi).filter((v) => !Number.isNaN(v));
  const ndreSeries = sorted.map((p) => p.ndre).filter((v): v is number => v != null && !Number.isNaN(v));
  const dpSeries = sorted.map((p) => p.dpRvi).filter((v): v is number => v != null && !Number.isNaN(v));

  const last7 = sorted.filter((p) => {
    if (!sorted.length) return false;
    const last = sorted[sorted.length - 1].capturedAt;
    return daysBetween(p.capturedAt, last) <= 7;
  });

  const last14 = sorted.filter((p) => {
    if (!sorted.length) return false;
    const last = sorted[sorted.length - 1].capturedAt;
    return daysBetween(p.capturedAt, last) <= 14;
  });

  const stage = profile.phenologyStages.find(
    (s) =>
      daysFromPlanting >= s.daysFromPlanting[0] &&
      daysFromPlanting <= s.daysFromPlanting[1]
  );

  let phenologyMatch: TemporalSignature['phenologyMatch'] = 'unknown';
  const latestNdvi = ndviSeries[ndviSeries.length - 1];
  if (stage && latestNdvi != null) {
    if (latestNdvi < stage.expectedNdvi[0] - 0.08) phenologyMatch = 'early';
    else if (latestNdvi > stage.expectedNdvi[1] + 0.08) phenologyMatch = 'late';
    else phenologyMatch = 'aligned';
  }

  return {
    ndviSlope7d: slope(last7.map((p) => p.ndvi)),
    ndviSlope14d: slope(last14.map((p) => p.ndvi)),
    ndreSlope7d: slope(last7.map((p) => p.ndre ?? p.ndvi)),
    dpRviSlope7d: slope(last7.map((p) => p.dpRvi ?? 0).filter((v) => v > 0)),
    peakNdvi: ndviSeries.length ? Math.max(...ndviSeries) : null,
    peakDpRvi: dpSeries.length ? Math.max(...dpSeries) : null,
    sampleCount: sorted.length,
    phenologyPhase: stage?.stage ?? null,
    phenologyMatch,
  };
}

export function detectTemporalAnomalies(
  temporal: TemporalSignature,
  optical: { ndre?: number; ndvi?: number; redsi?: number | null; lswi?: number; msi?: number; evi?: number },
  crop: ScienceCropId
): string[] {
  const flags: string[] = [];

  if (temporal.ndreSlope7d != null && temporal.ndreSlope7d <= -0.03) {
    flags.push('ndre_decline_7d');
  }
  if (temporal.ndviSlope7d != null && temporal.ndviSlope7d <= -0.05) {
    flags.push('ndvi_sudden_decline_7d');
  }
  if (temporal.dpRviSlope7d != null && temporal.dpRviSlope7d <= -0.02) {
    flags.push('dprvi_decline_7d');
  }
  if (temporal.phenologyMatch === 'early') {
    flags.push('phenology_behind_expected');
  }
  if (temporal.phenologyMatch === 'late') {
    flags.push('phenology_ahead_or_stress');
  }
  if (temporal.parcelOutlier) {
    flags.push('parcel_outlier');
  }

  if (crop === 'wheat' && optical.redsi != null && optical.redsi < 0.25) {
    flags.push('redsi_rust_risk');
  }
  if (crop === 'corn' && optical.ndre != null && optical.ndvi != null) {
    const ndreThreshold =
      temporal.phenologyPhase === 'Grain Fill' ? 0.32 : 0.28;
    if (optical.ndvi > 0.65 && optical.ndre < ndreThreshold) {
      flags.push('ndre_stress_dense_canopy');
    }
    if (
      temporal.phenologyPhase === 'Grain Fill' &&
      optical.evi != null &&
      optical.evi < optical.ndvi * 0.55
    ) {
      flags.push('evi_ndvi_grain_fill_divergence');
    }
  }
  if (crop === 'soybean') {
    if (optical.ndre != null && optical.ndre < 0.28) {
      flags.push('ndre_early_stress');
    }
    if (temporal.ndreSlope7d != null && temporal.ndreSlope7d <= -0.025) {
      flags.push('rust_risk_ndre');
    }
    if (optical.msi != null && optical.msi > 1.8 && optical.lswi != null && optical.lswi < 0) {
      flags.push('sds_moisture_pattern');
    }
    if (temporal.dpRviSlope7d != null && temporal.dpRviSlope7d <= -0.015) {
      flags.push('dpRvi_biomass_anomaly');
    }
  }

  return flags;
}

export { detectParcelOutlier };
export type { ZoneHistoryPoint };
