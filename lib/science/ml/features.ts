import type { Field } from '@/lib/types/field';
import type {
  MlFeatureVector,
  OpticalIndices,
  RadarIndices,
  TemporalSignature,
} from '../types';

export function buildMlFeatures(
  field: Field,
  optical: Partial<OpticalIndices>,
  radar: Partial<RadarIndices>,
  temporal: TemporalSignature,
  lst?: number | null
): MlFeatureVector {
  return {
    ndvi: optical.ndvi ?? 0.5,
    ndre: optical.ndre ?? 0.35,
    evi: optical.evi ?? 0.4,
    lswi: optical.lswi ?? 0.1,
    msi: optical.msi ?? 1.0,
    dpRvi: radar.dpRvi ?? 0.15,
    rvi: radar.rvi ?? 0.5,
    ndviSlope7d: temporal.ndviSlope7d ?? 0,
    ndreSlope7d: temporal.ndreSlope7d ?? 0,
    daysFromPlanting: field.daysFromPlanting,
    lst: lst ?? 28,
  };
}

export const FEATURE_ORDER: (keyof MlFeatureVector)[] = [
  'ndvi',
  'ndre',
  'evi',
  'lswi',
  'msi',
  'dpRvi',
  'rvi',
  'ndviSlope7d',
  'ndreSlope7d',
  'daysFromPlanting',
  'lst',
];

export function featuresToArray(f: MlFeatureVector): number[] {
  return FEATURE_ORDER.map((k) => f[k]);
}
