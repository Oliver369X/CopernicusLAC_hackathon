import { describe, it, expect } from 'vitest';
import { computeAllOptical, computeNdre, computeEvi } from '@/lib/science/indices/optical';
import { computeDpRvi, computeRvi, computeAllRadar } from '@/lib/science/indices/radar';
import { buildTemporalSignature, detectTemporalAnomalies } from '@/lib/science/phenology/temporal-signature';
import { detectParcelOutlier } from '@/lib/science/phenology/outlier-detector';
import { assembleMultisensorAnalysis } from '@/lib/science/fusion/multisensor-score';
import { enrichWithMl, predictMlHealth, buildMlFeatures } from '@/lib/science/ml/predict';
import { inferProductionClass } from '@/lib/science/agroforestry/classifier';
import { WHEAT_SCIENCE_PROFILE } from '@/lib/science/crops/wheat';
import { CORN_SCIENCE_PROFILE } from '@/lib/science/crops/corn';
import { SOYBEAN_SCIENCE_PROFILE } from '@/lib/science/crops/soybean';
import { MOCK_FIELDS } from '@/lib/mock-data/fields';

describe('optical indices', () => {
  it('computes NDRE and EVI from bands', () => {
    const bands = { b02: 0.05, b03: 0.08, b04: 0.06, b05: 0.12, b08: 0.45, b11: 0.2 };
    const all = computeAllOptical(bands);
    expect(all.ndre).toBeCloseTo(computeNdre(0.45, 0.12), 3);
    expect(all.evi).toBeCloseTo(computeEvi(0.45, 0.06, 0.05), 2);
    expect(all.redsi).toBeGreaterThan(0);
  });
});

describe('radar indices', () => {
  it('computes DpRVI and RVI (Mandal 2020 form)', () => {
    const vv = 0.25;
    const vh = 0.08;
    const rvi = computeRvi(vv, vh);
    const dprvi = computeDpRvi(vv, vh);
    expect(rvi).toBeGreaterThan(0);
    expect(dprvi).toBeGreaterThan(0);
    const all = computeAllRadar(vv, vh);
    expect(all.vhVvRatio).toBeCloseTo(vh / vv, 4);
  });
});

describe('wheat temporal signature', () => {
  it('detects NDRE decline anomaly', () => {
    const history = [
      { capturedAt: '2026-05-01T00:00:00Z', ndvi: 0.7, ndre: 0.42 },
      { capturedAt: '2026-05-08T00:00:00Z', ndvi: 0.68, ndre: 0.38 },
      { capturedAt: '2026-05-15T00:00:00Z', ndvi: 0.65, ndre: 0.32 },
    ];
    const temporal = buildTemporalSignature(history, 95, WHEAT_SCIENCE_PROFILE);
    const flags = detectTemporalAnomalies(temporal, { ndre: 0.32, ndvi: 0.65, redsi: 0.22 }, 'wheat');
    expect(flags).toContain('ndre_decline_7d');
    expect(flags).toContain('redsi_rust_risk');
  });
});

describe('corn multisensor fusion', () => {
  it('assembles analysis with fusion score', () => {
    const temporal = buildTemporalSignature([], 70, CORN_SCIENCE_PROFILE);
    const analysis = assembleMultisensorAnalysis({
      crop: 'corn',
      fieldId: 'f1',
      zoneId: 'z1',
      capturedAt: new Date().toISOString(),
      optical: { ndvi: 0.75, ndre: 0.38, evi: 0.55 },
      radar: { dpRvi: 0.28, rvi: 0.65, vv: 0.2, vh: 0.07, vhVvRatio: 0.35 },
      temporal,
      anomalyFlags: [],
      source: 'mock',
    });
    expect(analysis.fusionScore).toBeGreaterThan(0.3);
    expect(analysis.narrative).toContain('Maíz');
    expect(analysis.narrative).toContain('DpRVI');
  });

  it('detects grain fill EVI divergence', () => {
    const temporal = buildTemporalSignature([], 95, CORN_SCIENCE_PROFILE);
    temporal.phenologyPhase = 'Grain Fill';
    const flags = detectTemporalAnomalies(
      temporal,
      { ndvi: 0.78, ndre: 0.3, evi: 0.35 },
      'corn'
    );
    expect(flags).toContain('evi_ndvi_grain_fill_divergence');
  });
});

describe('soybean science', () => {
  it('detects NDRE rust risk flags', () => {
    const history = [
      { capturedAt: '2026-05-01T00:00:00Z', ndvi: 0.72, ndre: 0.38 },
      { capturedAt: '2026-05-08T00:00:00Z', ndvi: 0.71, ndre: 0.34 },
      { capturedAt: '2026-05-15T00:00:00Z', ndvi: 0.7, ndre: 0.29 },
    ];
    const temporal = buildTemporalSignature(history, 75, SOYBEAN_SCIENCE_PROFILE);
    const flags = detectTemporalAnomalies(
      temporal,
      { ndre: 0.27, ndvi: 0.7, msi: 2.0, lswi: -0.1 },
      'soybean'
    );
    expect(flags).toContain('ndre_early_stress');
    expect(flags).toContain('rust_risk_ndre');
    expect(flags).toContain('sds_moisture_pattern');
  });

  it('enriches with ML baseline', () => {
    const field = MOCK_FIELDS[0];
    const temporal = buildTemporalSignature([], 60, SOYBEAN_SCIENCE_PROFILE);
    let analysis = assembleMultisensorAnalysis({
      crop: 'soybean',
      fieldId: field.id,
      zoneId: field.zones[0].id,
      capturedAt: new Date().toISOString(),
      optical: { ndvi: 0.65, ndre: 0.25, msi: 2.0 },
      radar: { dpRvi: 0.1 },
      temporal,
      anomalyFlags: ['ndre_early_stress'],
      source: 'mock',
    });
    analysis = enrichWithMl(analysis, field);
    expect(analysis.fusionScoreMl).toBeDefined();
    expect(analysis.healthLabelMl).toBeDefined();
  });
});

describe('parcel outlier (Mouret)', () => {
  it('flags z-score outlier', () => {
    const history = Array.from({ length: 8 }, (_, i) => ({
      captured_at: `2026-05-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
      ndvi: 0.7,
      ndmi: 0.5,
    }));
    expect(detectParcelOutlier(history, 0.45)).toBe(true);
    expect(detectParcelOutlier(history, 0.7)).toBe(false);
  });
});

describe('agroforestry classifier', () => {
  it('classifies full sun vs shaded', () => {
    expect(inferProductionClass({ ndvi: 0.8 }, { sarHomogeneity: 0.7, sarContrast: 0.2 })).toBe(
      'full_sun'
    );
    expect(inferProductionClass({ ndvi: 0.62 }, { sarContrast: 0.5 })).toBe('shaded');
  });
});

describe('ML features', () => {
  it('predicts health from feature vector', () => {
    const field = MOCK_FIELDS[0];
    const features = buildMlFeatures(
      field,
      { ndvi: 0.5, ndre: 0.22, msi: 2.0 },
      { dpRvi: 0.08 },
      { ndviSlope7d: -0.04, ndreSlope7d: -0.04, sampleCount: 5, phenologyMatch: 'unknown', ndviSlope14d: null, dpRviSlope7d: null, peakNdvi: null, peakDpRvi: null, phenologyPhase: null },
      35
    );
    const ml = predictMlHealth('soybean', features);
    expect(['excellent', 'good', 'warning', 'critical']).toContain(ml.label);
  });
});
