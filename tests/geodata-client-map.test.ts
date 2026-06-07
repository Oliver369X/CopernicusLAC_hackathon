import { describe, it, expect } from 'vitest';
import { mapIntelligencePackage } from '@/lib/integrations/geodata/client';

const FIXTURE = {
  unit_type: 'parcel',
  unit_key: 'SJ-NORTE-001',
  region_code: 'SC-BO',
  computed_at: '2026-06-07T18:47:44.593659Z',
  optical: {
    ndvi_mean: 0.58,
    ndwi_mean: 0.42,
    crop_health_status: 'good',
    inputs: { cloud_fraction: 0.12 },
  },
  sar: { sar_soil_moisture: 0.38, sar_flood_pct: 0.0 },
  fire: {
    fire_count: 2,
    fire_risk_score: 0.35,
    inputs: { nearest_km: 14.2 },
  },
};

describe('mapIntelligencePackage', () => {
  it('mapea campos del contrato Data-Historica', () => {
    const pkg = mapIntelligencePackage(FIXTURE, 'parcel');
    expect(pkg.parcelKey).toBe('SJ-NORTE-001');
    expect(pkg.regionCode).toBe('SC-BO');
    expect(pkg.optical?.ndviMean).toBe(0.58);
    expect(pkg.optical?.ndmiMean).toBe(0.42);
    expect(pkg.optical?.cloudFraction).toBe(0.12);
    expect(pkg.sar?.soilMoisture).toBe(0.38);
    expect(pkg.fire?.hotspotCount7d).toBe(2);
    expect(pkg.fire?.nearestKm).toBe(14.2);
    expect(pkg.resolutionSource).toBe('parcel');
  });
});
