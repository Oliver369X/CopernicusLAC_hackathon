import type { CropScienceProfile, MultisensorAnalysis, OpticalIndices, RadarIndices, ScienceCropId, TemporalSignature } from '../types';
import { getScienceProfile } from '../crops/registry';
import { normalizeIndexValue } from '../calibration';
import { SCIENCE_ALGORITHM_VERSION } from '../version';

const CROP_NAMES: Record<ScienceCropId, string> = {
  soybean: 'Soja',
  wheat: 'Trigo',
  corn: 'Maíz',
  coffee: 'Café',
  cacao: 'Cacao',
};

function normalizeIndex(id: string, value: number, crop: ScienceCropId): number {
  return normalizeIndexValue(id, value, crop);
}

function scoreFromWeights(
  profile: CropScienceProfile,
  optical: Partial<OpticalIndices>,
  radar: Partial<RadarIndices>
): number {
  let sum = 0;
  let wSum = 0;

  for (const w of profile.primaryOptical) {
    const val = optical[w.id as keyof OpticalIndices];
    if (val == null || Number.isNaN(val)) continue;
    sum += normalizeIndex(w.id, val, profile.crop) * w.weight;
    wSum += w.weight;
  }

  for (const w of profile.primaryRadar) {
    const val = radar[w.id as keyof RadarIndices];
    if (val == null || Number.isNaN(val)) continue;
    sum += normalizeIndex(w.id, val, profile.crop) * w.weight;
    wSum += w.weight;
  }

  return wSum > 0 ? sum / wSum : 0.5;
}

function healthFromScore(score: number): MultisensorAnalysis['healthLabel'] {
  if (score >= 0.72) return 'excellent';
  if (score >= 0.55) return 'good';
  if (score >= 0.38) return 'warning';
  return 'critical';
}

export function buildFusionNarrative(
  crop: ScienceCropId,
  optical: Partial<OpticalIndices>,
  radar: Partial<RadarIndices>,
  temporal: TemporalSignature,
  anomalyFlags: string[]
): string {
  const parts: string[] = [];
  const name = CROP_NAMES[crop];

  if (optical.ndre != null) {
    parts.push(`S2 NDRE ${optical.ndre.toFixed(2)}`);
  }
  if (optical.evi != null && (crop === 'corn' || crop === 'soybean')) {
    parts.push(`EVI ${optical.evi.toFixed(2)}`);
  }
  if (optical.redsi != null && crop === 'wheat') {
    parts.push(`REDSI ${optical.redsi.toFixed(2)}`);
  }
  if (radar.dpRvi != null) {
    parts.push(`S1 DpRVI ${radar.dpRvi.toFixed(2)}`);
  }
  if (radar.sarContrast != null && (crop === 'coffee' || crop === 'cacao')) {
    parts.push(`SAR textura contraste ${radar.sarContrast.toFixed(2)}`);
  }
  if (temporal.phenologyPhase) {
    parts.push(`Fase: ${temporal.phenologyPhase} (${temporal.phenologyMatch})`);
  }
  if (temporal.ndreSlope7d != null && temporal.ndreSlope7d <= -0.02) {
    parts.push(`NDRE ↓ ${(temporal.ndreSlope7d * 100).toFixed(0)}% en 7d`);
  }
  if (anomalyFlags.includes('redsi_rust_risk')) {
    parts.push('Riesgo roya amarilla — validar REDSI en campo.');
  }
  if (anomalyFlags.includes('ndre_stress_dense_canopy')) {
    parts.push('Estrés clorofílico en dosel denso (NDRE bajo con NDVI alto).');
  }
  if (anomalyFlags.includes('ndre_early_stress')) {
    parts.push('Detección temprana Red Edge — validar en campo.');
  }
  if (anomalyFlags.includes('rust_risk_ndre')) {
    parts.push('Riesgo roya — NDRE en declive.');
  }
  if (anomalyFlags.includes('parcel_outlier')) {
    parts.push('Outlier parcela vs historial (Mouret 2020).');
  }
  if (anomalyFlags.includes('agroforestry_uncertainty')) {
    parts.push('Alta incertidumbre agroforestería — no clasificación binaria.');
  }

  if (!parts.length) {
    return `${name}: datos insuficientes para fusión multisensor.`;
  }

  return `${name} — ${parts.join('. ')}.`;
}

export function computeMultisensorScore(
  crop: ScienceCropId,
  optical: Partial<OpticalIndices>,
  radar: Partial<RadarIndices>,
  temporal: TemporalSignature,
  anomalyFlags: string[]
): number {
  const profile = getScienceProfile(crop);
  let score = scoreFromWeights(profile, optical, radar);

  for (const flag of anomalyFlags) {
    if (flag.includes('decline') || flag.includes('rust') || flag.includes('stress')) {
      score -= 0.08;
    }
    if (flag === 'phenology_behind_expected') score -= 0.04;
  }

  if (temporal.phenologyMatch === 'aligned') score += 0.03;

  return Math.max(0, Math.min(1, score));
}

export function assembleMultisensorAnalysis(input: {
  crop: ScienceCropId;
  fieldId: string;
  zoneId: string;
  capturedAt: string;
  optical: Partial<OpticalIndices>;
  radar: Partial<RadarIndices>;
  temporal: TemporalSignature;
  anomalyFlags: string[];
  lst?: number | null;
  source: MultisensorAnalysis['source'];
}): MultisensorAnalysis {
  const profile = getScienceProfile(input.crop);
  const fusionScore = computeMultisensorScore(
    input.crop,
    input.optical,
    input.radar,
    input.temporal,
    input.anomalyFlags
  );

  return {
    crop: input.crop,
    fieldId: input.fieldId,
    zoneId: input.zoneId,
    capturedAt: input.capturedAt,
    optical: input.optical,
    radar: input.radar,
    temporal: input.temporal,
    fusionScore,
    healthLabel: healthFromScore(fusionScore),
    anomalyFlags: input.anomalyFlags,
    narrative: buildFusionNarrative(
      input.crop,
      input.optical,
      input.radar,
      input.temporal,
      input.anomalyFlags
    ),
    references: profile.references,
    source: input.source,
    lst: input.lst,
    algorithmVersion: SCIENCE_ALGORITHM_VERSION,
  };
}
