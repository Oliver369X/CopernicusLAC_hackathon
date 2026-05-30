import type { Field } from '@/lib/types/field';
import type { HealthLabel, MlFeatureVector, MultisensorAnalysis } from '../types';
import { buildMlFeatures } from './features';
import { getModel, applyModelRules, scoresToHealth } from './model-registry';

export { buildMlFeatures, FEATURE_ORDER, featuresToArray } from './features';
export { getModel, getModelVersion, clearModelCache } from './model-registry';
export type { MlModelJson, MlModelRule } from './model-registry';

export function predictMlHealth(
  crop: string,
  features: MlFeatureVector
): { score: number; label: HealthLabel } {
  if (process.env.ML_ENABLED === 'false') {
    return { score: 0.5, label: 'good' };
  }
  const model = getModel(crop);
  const scores = applyModelRules(model, features);
  return scoresToHealth(scores);
}

export function enrichWithMl(
  analysis: MultisensorAnalysis,
  field: Field
): MultisensorAnalysis {
  const features = buildMlFeatures(
    field,
    analysis.optical,
    analysis.radar,
    analysis.temporal,
    analysis.lst
  );
  const ml = predictMlHealth(analysis.crop, features);
  return {
    ...analysis,
    fusionScoreMl: ml.score,
    healthLabelMl: ml.label,
    mlConcordance: ml.label === analysis.healthLabel,
  };
}
