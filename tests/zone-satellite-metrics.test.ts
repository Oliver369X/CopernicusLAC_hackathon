import { describe, it, expect } from 'vitest';
import {
  getSatelliteReadingForZoneOnDate,
  getNearestReadingOnOrBefore,
  listAvailableReadingDates,
  getSatelliteReadingsForZoneRange,
} from '@/lib/data/zone-satellite-metrics';
import { createMockSatelliteService } from './helpers/mock-satellite-db';

const ROWS = [
  { zone_id: 'zone-sj-n-1', reading_date: '2026-06-05', ndvi: 0.64, ndmi: 0.47, ndre: 0.38 },
  { zone_id: 'zone-sj-n-1', reading_date: '2026-06-04', ndvi: 0.63, ndmi: 0.46, ndre: 0.37 },
  { zone_id: 'zone-sj-n-1', reading_date: '2026-06-03', ndvi: 0.62, ndmi: 0.45, ndre: 0.36 },
  { zone_id: 'zone-sj-n-2', reading_date: '2026-06-05', ndvi: 0.55, ndmi: 0.38, ndre: 0.32 },
];

describe('zone-satellite-metrics asOf', () => {
  it('fecha exacta existe', async () => {
    const service = createMockSatelliteService(ROWS);
    const snap = await getSatelliteReadingForZoneOnDate(service, 'zone-sj-n-1', '2026-06-05');
    expect(snap?.ndvi).toBe(0.64);
  });

  it('fecha no existe devuelve null', async () => {
    const service = createMockSatelliteService(ROWS);
    const snap = await getSatelliteReadingForZoneOnDate(service, 'zone-sj-n-1', '2020-01-01');
    expect(snap).toBeNull();
  });

  it('getNearestOnOrBefore devuelve día anterior más cercano', async () => {
    const service = createMockSatelliteService(ROWS);
    const snap = await getNearestReadingOnOrBefore(service, 'zone-sj-n-1', '2026-06-04');
    expect(snap?.readingDate).toBe('2026-06-04');
    expect(snap?.ndvi).toBe(0.63);
  });

  it('listAvailableReadingDates orden DESC sin duplicados', async () => {
    const service = createMockSatelliteService(ROWS);
    const dates = await listAvailableReadingDates(service, 'zone-sj-n-1');
    expect(dates).toEqual(['2026-06-05', '2026-06-04', '2026-06-03']);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it('rango 7 días devuelve entre 1 y 7 puntos', async () => {
    const service = createMockSatelliteService(ROWS);
    const range = await getSatelliteReadingsForZoneRange(
      service,
      'zone-sj-n-1',
      '2026-06-01',
      '2026-06-07'
    );
    expect(range.length).toBeGreaterThanOrEqual(1);
    expect(range.length).toBeLessThanOrEqual(7);
  });

  it('sin filas devuelve vacío o null', async () => {
    const service = createMockSatelliteService([]);
    expect(await getSatelliteReadingForZoneOnDate(service, 'zone-sj-n-1', '2026-06-05')).toBeNull();
    expect(await listAvailableReadingDates(service, 'zone-sj-n-1')).toEqual([]);
    expect(
      await getSatelliteReadingsForZoneRange(service, 'zone-sj-n-1', '2026-06-01', '2026-06-07')
    ).toEqual([]);
  });
});
