import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeCropMultisensor } from '@/lib/science/analyze';
import { MOCK_FIELDS } from '@/lib/mock-data/fields';
import { createMockSatelliteService } from './helpers/mock-satellite-db';

vi.mock('@/lib/services/copernicus/statistics', () => ({
  fetchS2ExtendedStatistics: vi.fn(async () => ({ ndvi: 0.99 })),
  fetchS1ExtendedStatistics: vi.fn(async () => ({ vv: 0.1, vh: 0.05 })),
}));

vi.mock('@/lib/services/copernicus/process-textures', () => ({
  estimateS1Textures: vi.fn(async () => null),
}));

describe('analyzeCropMultisensor DB-first', () => {
  const field = MOCK_FIELDS[0];
  const zoneId = 'zone-sj-n-1';

  beforeEach(() => {
    vi.stubEnv('COPERNICUS_CLIENT_ID', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('DB row ndvi=0.71 → source=database', async () => {
    const service = createMockSatelliteService([
      {
        zone_id: zoneId,
        reading_date: '2026-06-05',
        ndvi: 0.71,
        ndmi: 0.5,
        ndre: 0.4,
      },
    ]);
    const analysis = await analyzeCropMultisensor('soybean', field, zoneId, service, {
      asOfDate: '2026-06-05',
      allowLiveFetch: false,
    });
    expect(analysis.source).toBe('database');
    expect(analysis.optical.ndvi).toBe(0.71);
  });

  it('allowLiveFetch false no invoca Copernicus', async () => {
    const { fetchS2ExtendedStatistics } = await import(
      '@/lib/services/copernicus/statistics'
    );
    const service = createMockSatelliteService([
      {
        zone_id: zoneId,
        reading_date: '2026-06-05',
        ndvi: 0.6,
        ndmi: 0.4,
        ndre: 0.3,
      },
    ]);
    await analyzeCropMultisensor('soybean', field, zoneId, service, {
      allowLiveFetch: false,
    });
    expect(fetchS2ExtendedStatistics).not.toHaveBeenCalled();
  });

  it('sin DB → source=mock', async () => {
    const analysis = await analyzeCropMultisensor('soybean', field, zoneId, null, {
      allowLiveFetch: false,
    });
    expect(analysis.source).toBe('mock');
    expect(analysis.provenance?.dataSource).toBe('mock');
  });

  it('asOf sin fila usa nearest en provenance', async () => {
    const service = createMockSatelliteService([
      {
        zone_id: zoneId,
        reading_date: '2026-06-03',
        ndvi: 0.62,
        ndmi: 0.45,
        ndre: 0.36,
      },
    ]);
    const analysis = await analyzeCropMultisensor('soybean', field, zoneId, service, {
      asOfDate: '2026-06-05',
      allowLiveFetch: false,
    });
    expect(analysis.source).toBe('database');
    expect(analysis.provenance?.readingDate).toBe('2026-06-03');
  });

  it('provenance.availableDates poblado', async () => {
    const service = createMockSatelliteService([
      { zone_id: zoneId, reading_date: '2026-06-05', ndvi: 0.64, ndmi: 0.47 },
      { zone_id: zoneId, reading_date: '2026-06-04', ndvi: 0.63, ndmi: 0.46 },
    ]);
    const analysis = await analyzeCropMultisensor('soybean', field, zoneId, service);
    expect((analysis.provenance?.availableDates.length ?? 0)).toBeGreaterThanOrEqual(1);
  });
});
