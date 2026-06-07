import { describe, it, expect } from 'vitest';
import { mapIntelligencePackage, mapParcelSeries } from '@/lib/integrations/geodata/client';

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

describe('mapParcelSeries', () => {
  it('expone provenance CDSE', () => {
    const mapped = mapParcelSeries({
      parcel_key: 'ROSA-SOJA-500',
      count: 1,
      series: [{ sensing_date: '2024-04-01', ndvi_mean: 0.6 }],
      data_quality: 'cdse',
      source_providers: ['CDSE'],
    });
    expect(mapped.dataQuality).toBe('cdse');
    expect(mapped.sourceProviders).toEqual(['CDSE']);
  });

  it('infiere demo en serie mensual duplicada', () => {
    const mapped = mapParcelSeries({
      parcel_key: 'LUCIA-SOJA-10',
      count: 4,
      series: [
        { sensing_date: '2024-01-15', ndvi_mean: 0.5 },
        { sensing_date: '2024-01-15', ndvi_mean: 0.52 },
        { sensing_date: '2024-02-15', ndvi_mean: 0.55 },
        { sensing_date: '2024-02-15', ndvi_mean: 0.56 },
      ],
    });
    expect(mapped.dataQuality).toBe('demo');
  });
});
