import { describe, it, expect } from 'vitest';
import { enrichAnalysisWithGeodata } from '@/lib/integrations/geodata/mapper';
import type { MultisensorAnalysis } from '@/lib/science/types';
import type { IntelligencePackage } from '@/lib/integrations/geodata/types';

const BASE: MultisensorAnalysis = {
  crop: 'soybean',
  fieldId: 'field-sj-norte',
  zoneId: 'zone-sj-n-1',
  capturedAt: '2026-06-07T00:00:00.000Z',
  optical: { ndvi: 0.6 },
  radar: {},
  temporal: {
    ndviSlope7d: null,
    ndviSlope14d: null,
    dpRviSlope7d: null,
    ndreSlope7d: null,
    peakNdvi: null,
    peakDpRvi: null,
    sampleCount: 0,
    phenologyPhase: null,
    phenologyMatch: 'unknown',
  },
  fusionScore: 72,
  healthLabel: 'good',
  anomalyFlags: [],
  narrative: 'Cultivo estable.',
  references: [],
  source: 'database',
  provenance: {
    readingDate: '2026-06-01',
    sceneDate: '2026-06-01',
    capturedAt: '2026-06-07T00:00:00.000Z',
    dataSource: 'database',
    availableDates: ['2026-06-01'],
    liveFetchUsed: false,
  },
};

const PKG: IntelligencePackage = {
  parcelKey: 'SJ-NORTE-001',
  regionCode: 'SC-BO',
  fire: { hotspotCount7d: 3, nearestKm: 10.5 },
  optical: { cloudFraction: 0.5 },
  sar: { soilMoisture: 0.25 },
  resolutionSource: 'parcel',
};

describe('enrichAnalysisWithGeodata', () => {
  it('añade flags y narrativa sin tocar NDVI local', () => {
    const out = enrichAnalysisWithGeodata(BASE, PKG);
    expect(out.optical.ndvi).toBe(0.6);
    expect(out.anomalyFlags).toContain('geodata_fire_proximity');
    expect(out.anomalyFlags).toContain('geodata_high_cloud');
    expect(out.anomalyFlags).toContain('geodata_sar_stress');
    expect(out.narrative).toContain('Geo-Data');
    expect(out.provenance?.geodataUsed).toBe(true);
    expect(out.provenance?.geodataParcelKey).toBe('SJ-NORTE-001');
  });
});
