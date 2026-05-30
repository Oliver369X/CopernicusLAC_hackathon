import type { ScienceCropId } from './types';

/** Crop-specific normalization ranges for fusion score (literature + LAC defaults). */
export const INDEX_RANGES: Record<string, [number, number]> = {
  ndvi: [0.2, 0.85],
  ndre: [0.15, 0.55],
  evi: [0.1, 0.7],
  savi: [0.1, 0.7],
  lswi: [-0.2, 0.4],
  msi: [0.5, 2.5],
  ndwi: [-0.5, 0.4],
  redsi: [0.15, 0.55],
  dpRvi: [0.05, 0.45],
  rvi: [0.2, 1.2],
  vhVvRatio: [0.1, 0.8],
  sarContrast: [0.0, 1.0],
  sarHomogeneity: [0.0, 1.0],
};

const CROP_OVERRIDES: Partial<Record<ScienceCropId, Record<string, [number, number]>>> = {
  soybean: { ndre: [0.2, 0.58], ndvi: [0.35, 0.88] },
  wheat: { redsi: [0.18, 0.52], ndre: [0.18, 0.52] },
  corn: { ndre: [0.22, 0.58], evi: [0.15, 0.75] },
  coffee: { ndvi: [0.45, 0.82], dpRvi: [0.08, 0.35] },
  cacao: { ndvi: [0.5, 0.85], dpRvi: [0.1, 0.38] },
};

export function normalizeIndexValue(
  id: string,
  value: number,
  crop: ScienceCropId
): number {
  const override = CROP_OVERRIDES[crop]?.[id];
  const [lo, hi] = override ?? INDEX_RANGES[id] ?? [0, 1];
  return Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
}
