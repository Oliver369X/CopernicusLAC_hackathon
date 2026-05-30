import type { ZoneHistoryPoint } from '@/lib/data/zone-satellite-metrics';

/** Parcel-level outlier detection (Mouret et al. 2020 inspired). */
export function detectParcelOutlier(
  history: ZoneHistoryPoint[],
  currentNdvi: number,
  zThreshold = 2.0
): boolean {
  const ndvis = history.map((h) => h.ndvi).filter((v) => !Number.isNaN(v));
  if (ndvis.length < 5) return false;
  const mean = ndvis.reduce((a, b) => a + b, 0) / ndvis.length;
  const variance =
    ndvis.reduce((s, v) => s + (v - mean) ** 2, 0) / ndvis.length;
  const std = Math.sqrt(variance) || 0.01;
  const z = Math.abs((currentNdvi - mean) / std);
  return z >= zThreshold;
}
