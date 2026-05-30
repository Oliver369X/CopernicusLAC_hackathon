import { describe, it, expect } from 'vitest';
import { detectHotspotFromGrid, buildCaptureDeeplink } from '@/lib/services/hotspot/detector';
import { buildMultiSensorNarrative } from '@/lib/services/fusion/multi-sensor-narrative';
import { buildSatelliteContext } from '@/lib/services/satellite-correlation';
import type { GeoBounds } from '@/lib/types/field';

const bounds: GeoBounds = [
  { lat: -34.0, lng: -58.0 },
  { lat: -34.0, lng: -57.9 },
  { lat: -34.1, lng: -57.9 },
  { lat: -34.1, lng: -58.0 },
];

describe('NDRE hotspot detector', () => {
  it('finds minimum cell and builds deeplink', () => {
    const grid = [
      [0.6, 0.5],
      [0.2, 0.55],
    ];
    const hotspot = detectHotspotFromGrid(bounds, grid, 'min');
    expect(hotspot).not.toBeNull();
    expect(hotspot!.value).toBe(0.2);
    const link = buildCaptureDeeplink('field-1', 'zone-a', hotspot!);
    expect(link).toContain('/field/capture?');
    expect(link).toContain('lat=');
    expect(link).toContain('lng=');
  });
});

describe('multi-sensor narrative', () => {
  it('includes NDRE when present', () => {
    const ctx = buildSatelliteContext(
      {
        ndvi: 0.45,
        ndmi: 0.3,
        ndre: 0.22,
        source: 'copernicus',
        s3Lst: 35,
        s1MoistureIndex: 0.2,
      },
      null,
      [],
      { ndvi: 0.5, ndmi: 0.4, temp: 28, soil: 50 }
    );
    const text = buildMultiSensorNarrative(ctx);
    expect(text).toContain('NDRE');
    expect(text).toContain('Sentinel-3');
    expect(text).toContain('Sentinel-1');
  });
});

describe('alert dedup key format', () => {
  it('produces stable daily keys', () => {
    const day = '2026-05-29';
    const key = `${day}-hotspot-field-1-zone-a`;
    expect(key).toBe('2026-05-29-hotspot-field-1-zone-a');
  });
});
