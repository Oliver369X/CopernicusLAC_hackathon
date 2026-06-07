import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mapParcelSeries } from '@/lib/integrations/geodata/client';

vi.mock('@/lib/db/get-service', () => ({
  getDbService: vi.fn().mockResolvedValue({ from: vi.fn() }),
}));

vi.mock('@/lib/data/fields', () => ({
  getFieldByIdFromDb: vi.fn(),
}));

vi.mock('@/lib/integrations/geodata/registry', () => ({
  isGeodataEnabled: vi.fn(),
}));

vi.mock('@/lib/integrations/geodata/resolve-parcel-key', () => ({
  resolveFieldGeodataLink: vi.fn(),
}));

vi.mock('@/lib/integrations/geodata/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/integrations/geodata/client')>();
  return {
    ...actual,
    getParcelSeries: vi.fn(),
  };
});

vi.mock('@/lib/data/zone-satellite-metrics', () => ({
  getSatelliteReadingsForZoneRange: vi.fn(),
  getSatelliteHistoryForZone: vi.fn(),
}));

import { getFieldByIdFromDb } from '@/lib/data/fields';
import { isGeodataEnabled } from '@/lib/integrations/geodata/registry';
import { resolveFieldGeodataLink } from '@/lib/integrations/geodata/resolve-parcel-key';
import { getParcelSeries } from '@/lib/integrations/geodata/client';
import {
  getSatelliteHistoryForZone,
  getSatelliteReadingsForZoneRange,
} from '@/lib/data/zone-satellite-metrics';
import { resolveTimeseriesForField } from '@/lib/integrations/geodata/timeseries-adapter';

const mockField = {
  id: 'field-lucia-soja',
  zones: [{ id: 'zone-lucia-soja', name: 'Lucía' }],
};

describe('mapParcelSeries data_quality', () => {
  it('mapea data_quality y source_providers', () => {
    const mapped = mapParcelSeries({
      parcel_key: 'LUCIA-SOJA-10',
      count: 2,
      series: [
        { sensing_date: '2024-03-15', ndvi_mean: 0.62 },
        { sensing_date: '2024-06-15', ndvi_mean: 0.71 },
      ],
      data_quality: 'cdse',
      source_providers: ['CDSE'],
      dedup_applied: true,
    });
    expect(mapped.dataQuality).toBe('cdse');
    expect(mapped.sourceProviders).toEqual(['CDSE']);
    expect(mapped.dedupApplied).toBe(true);
  });
});

describe('resolveTimeseriesForField', () => {
  beforeEach(() => {
    vi.mocked(getFieldByIdFromDb).mockResolvedValue(mockField as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('prefiere geo-data CDSE cuando hay serie real', async () => {
    vi.mocked(isGeodataEnabled).mockReturnValue(true);
    vi.mocked(resolveFieldGeodataLink).mockResolvedValue({
      parcelKey: 'LUCIA-SOJA-10',
      regionCode: 'SC-BO',
    });
    vi.mocked(getParcelSeries).mockResolvedValue({
      parcelKey: 'LUCIA-SOJA-10',
      featureSet: 'optical',
      days: 1095,
      count: 2,
      series: [
        { date: '2024-03-15', ndvi: 0.62, ndwi: 0.4, evi: 0.5, cloudFreePct: 90 },
      ],
      dataQuality: 'cdse',
      sourceProviders: ['CDSE'],
    });

    const result = await resolveTimeseriesForField('field-lucia-soja');
    expect(result.source).toBe('geodata');
    expect(result.dataQuality).toBe('cdse');
    expect(result.fallbackUsed).toBe(false);
    expect(getSatelliteReadingsForZoneRange).not.toHaveBeenCalled();
  });

  it('excluye seed copernicus-personas-3y en fallback local', async () => {
    vi.mocked(isGeodataEnabled).mockReturnValue(true);
    vi.mocked(resolveFieldGeodataLink).mockResolvedValue({
      parcelKey: 'LUCIA-SOJA-10',
      regionCode: 'SC-BO',
    });
    vi.mocked(getParcelSeries).mockResolvedValue({
      parcelKey: 'LUCIA-SOJA-10',
      featureSet: 'optical',
      days: 1095,
      count: 0,
      series: [],
      dataQuality: 'empty',
    });
    vi.mocked(getSatelliteReadingsForZoneRange).mockResolvedValue([
      {
        captured_at: '2024-01-15T12:00:00.000Z',
        reading_date: '2024-01-15',
        ndvi: 0.5,
        ndmi: 0.3,
        source: 'copernicus-personas-3y',
      },
      {
        captured_at: '2024-02-15T12:00:00.000Z',
        reading_date: '2024-02-15',
        ndvi: 0.55,
        ndmi: 0.32,
        source: 'database',
      },
    ]);

    const result = await resolveTimeseriesForField('field-lucia-soja');
    expect(result.source).toBe('satellite_readings');
    expect(result.points).toHaveLength(1);
    expect(result.points[0].date).toBe('2024-02-15');
    expect(result.fallbackUsed).toBe(true);
  });

  it('usa local incluyendo seed como último recurso', async () => {
    vi.mocked(isGeodataEnabled).mockReturnValue(true);
    vi.mocked(resolveFieldGeodataLink).mockResolvedValue(null);
    vi.mocked(getSatelliteReadingsForZoneRange)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          captured_at: '2024-01-15T12:00:00.000Z',
          reading_date: '2024-01-15',
          ndvi: 0.5,
          ndmi: 0.3,
          source: 'copernicus-personas-3y',
        },
      ]);
    vi.mocked(getSatelliteHistoryForZone).mockResolvedValue([]);

    const result = await resolveTimeseriesForField('field-lucia-soja');
    expect(result.points).toHaveLength(1);
    expect(result.fallbackUsed).toBe(true);
  });
});
