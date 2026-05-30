import type { HealthLabel } from '../types';
import type { JoinedGroundTruth } from '../data/types';

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
}

export interface ValidationMetrics {
  crop: string;
  sampleCount: number;
  rulesVsAgronomist: ConfusionMatrix;
  mlVsAgronomist: ConfusionMatrix;
  rulesMlConcordance: number;
  rulesMlConcordancePct: number;
  diseasePrecision: Record<string, number>;
  diseaseRecall: Record<string, number>;
  phenologyMaeDays: number | null;
  algorithmVersion: string;
  modelVersion: string;
}

function labelMatch(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b) return false;
  return a === b;
}

function healthToBinary(h: string | undefined | null): 'stress' | 'ok' {
  if (!h || h === 'excellent' || h === 'good') return 'ok';
  return 'stress';
}

function updateBinaryMatrix(
  matrix: ConfusionMatrix,
  predicted: 'stress' | 'ok',
  actual: 'stress' | 'ok'
): void {
  if (predicted === 'stress' && actual === 'stress') matrix.tp++;
  else if (predicted === 'stress' && actual === 'ok') matrix.fp++;
  else if (predicted === 'ok' && actual === 'stress') matrix.fn++;
  else matrix.tn++;
}

function precisionRecall(matrix: ConfusionMatrix): { precision: number; recall: number } {
  const precision = matrix.tp + matrix.fp > 0 ? matrix.tp / (matrix.tp + matrix.fp) : 0;
  const recall = matrix.tp + matrix.fn > 0 ? matrix.tp / (matrix.tp + matrix.fn) : 0;
  return { precision, recall };
}

export function computeValidationMetrics(
  crop: string,
  samples: JoinedGroundTruth[],
  algorithmVersion: string,
  modelVersion: string
): ValidationMetrics {
  const rulesVsAgronomist: ConfusionMatrix = { tp: 0, fp: 0, fn: 0, tn: 0 };
  const mlVsAgronomist: ConfusionMatrix = { tp: 0, fp: 0, fn: 0, tn: 0 };
  let rulesMlAgree = 0;
  let rulesMlTotal = 0;

  const diseaseTp: Record<string, number> = {};
  const diseaseFp: Record<string, number> = {};
  const diseaseFn: Record<string, number> = {};

  for (const s of samples) {
    const actual = healthToBinary(s.healthLabel);
    if (s.healthLabelRules) {
      updateBinaryMatrix(rulesVsAgronomist, healthToBinary(s.healthLabelRules), actual);
    }
    if (s.healthLabelMl) {
      updateBinaryMatrix(mlVsAgronomist, healthToBinary(s.healthLabelMl), actual);
    }
    if (s.healthLabelRules && s.healthLabelMl) {
      rulesMlTotal++;
      if (labelMatch(s.healthLabelRules, s.healthLabelMl)) rulesMlAgree++;
    }

    if (s.diseaseLabel && s.healthLabel) {
      const stressed = actual === 'stress';
      const key = s.diseaseLabel.toLowerCase();
      if (stressed) {
        diseaseTp[key] = (diseaseTp[key] ?? 0) + 1;
      } else {
        diseaseFn[key] = (diseaseFn[key] ?? 0) + 1;
      }
    }
  }

  const diseasePrecision: Record<string, number> = {};
  const diseaseRecall: Record<string, number> = {};
  for (const key of new Set([...Object.keys(diseaseTp), ...Object.keys(diseaseFn)])) {
    const tp = diseaseTp[key] ?? 0;
    const fn = diseaseFn[key] ?? 0;
    const fp = diseaseFp[key] ?? 0;
    diseasePrecision[key] = tp + fp > 0 ? tp / (tp + fp) : 0;
    diseaseRecall[key] = tp + fn > 0 ? tp / (tp + fn) : 0;
  }

  return {
    crop,
    sampleCount: samples.length,
    rulesVsAgronomist,
    mlVsAgronomist,
    rulesMlConcordance: rulesMlAgree,
    rulesMlConcordancePct: rulesMlTotal > 0 ? rulesMlAgree / rulesMlTotal : 0,
    diseasePrecision,
    diseaseRecall,
    phenologyMaeDays: null,
    algorithmVersion,
    modelVersion,
  };
}

export function metricsSummaryForUi(metrics: ValidationMetrics): {
  rulesPrecision: number;
  rulesRecall: number;
  mlPrecision: number;
  mlRecall: number;
  concordancePct: number;
} {
  const r = precisionRecall(metrics.rulesVsAgronomist);
  const m = precisionRecall(metrics.mlVsAgronomist);
  return {
    rulesPrecision: r.precision,
    rulesRecall: r.recall,
    mlPrecision: m.precision,
    mlRecall: m.recall,
    concordancePct: metrics.rulesMlConcordancePct,
  };
}
