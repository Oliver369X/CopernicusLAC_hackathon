import { describe, it, expect } from 'vitest';
import { parseGroundTruthCsv } from '@/lib/science/data/parse-csv';
import { validateGroundTruthRows } from '@/lib/science/data/validate-rows';
import { getModel, applyModelRules, scoresToHealth, clearModelCache } from '@/lib/science/ml/model-registry';
import { buildMlFeatures } from '@/lib/science/ml/features';
import { computeValidationMetrics } from '@/lib/science/validation/metrics';
import { MOCK_FIELDS } from '@/lib/mock-data/fields';
import golden from './fixtures/science/soybean-golden.json';

describe('parseGroundTruthCsv', () => {
  it('parses soybean template rows', () => {
    const csv = `crop,field_id,zone_id,captured_at,disease_label,severity,health_label,lat,lng,source,notes
soybean,field-1,zone-1,2026-03-15,rust,medium,warning,-34.61,-58.38,manual_csv,test`;
    const rows = parseGroundTruthCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].crop).toBe('soybean');
    expect(rows[0].diseaseLabel).toBe('rust');
  });

  it('validates rows', () => {
    const csv = `crop,field_id,zone_id,captured_at,source
soybean,field-1,zone-1,2026-03-15,manual_csv`;
    const { valid, errors } = validateGroundTruthRows(parseGroundTruthCsv(csv));
    expect(valid).toHaveLength(1);
    expect(errors).toHaveLength(0);
  });
});

describe('model-registry', () => {
  it('loads embedded soybean model', () => {
    clearModelCache();
    const model = getModel('soybean');
    expect(model.version).toBeTruthy();
    expect(model.rules.length).toBeGreaterThan(0);
  });

  it('predicts from features', () => {
    const field = MOCK_FIELDS[0];
    const features = buildMlFeatures(
      field,
      { ndvi: 0.5, ndre: 0.22, msi: 2.0 },
      { dpRvi: 0.08 },
      {
        ndviSlope7d: -0.04,
        ndreSlope7d: -0.04,
        sampleCount: 5,
        phenologyMatch: 'unknown',
        ndviSlope14d: null,
        dpRviSlope7d: null,
        peakNdvi: null,
        peakDpRvi: null,
        phenologyPhase: null,
      },
      35
    );
    const scores = applyModelRules(getModel('soybean'), features);
    const { label } = scoresToHealth(scores);
    expect(['excellent', 'good', 'warning', 'critical']).toContain(label);
  });
});

describe('validation metrics', () => {
  it('computes concordance', () => {
    const metrics = computeValidationMetrics(
      'soybean',
      [
        {
          crop: 'soybean',
          fieldId: 'f1',
          capturedAt: '2026-01-01',
          source: 'test',
          healthLabel: 'warning',
          healthLabelRules: 'warning',
          healthLabelMl: 'good',
        },
      ],
      '1.0.0',
      '1.1.0'
    );
    expect(metrics.sampleCount).toBe(1);
    expect(metrics.rulesMlConcordancePct).toBe(0);
  });
});

describe('golden soybean assembly', () => {
  it('meets golden thresholds', async () => {
    const { assembleMultisensorAnalysis } = await import('@/lib/science/fusion/multisensor-score');
    const { SOYBEAN_SCIENCE_PROFILE } = await import('@/lib/science/crops/soybean');
    const { buildTemporalSignature } = await import('@/lib/science/phenology/temporal-signature');

    const temporal = buildTemporalSignature([], 60, SOYBEAN_SCIENCE_PROFILE);
    const analysis = assembleMultisensorAnalysis({
      crop: 'soybean',
      fieldId: 'field-1',
      zoneId: 'zone-1',
      capturedAt: new Date().toISOString(),
      optical: { ndvi: 0.65, ndre: 0.38 },
      radar: { dpRvi: 0.2 },
      temporal,
      anomalyFlags: [],
      source: 'mock',
    });
    expect(analysis.fusionScore).toBeGreaterThanOrEqual(golden.fusionScoreMin);
    expect(analysis.optical.ndvi).toBeGreaterThanOrEqual(golden.opticalMin.ndvi);
  });
});
