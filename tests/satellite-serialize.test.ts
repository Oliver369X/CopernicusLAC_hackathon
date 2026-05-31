import { describe, it, expect } from 'vitest';
import {
  buildSatelliteDataFromMetrics,
  metricsFromZone,
} from '@/lib/data/satellite-from-metrics';
import { getAverageValue } from '@/lib/mock-data/satellite-data';
import { serializeField, deserializeField } from '@/lib/utils/serialize-field';
import { MOCK_FIELDS } from '@/lib/mock-data/fields';
import { hasSatelliteCredentials } from '@/lib/services/satellite';
import {
  boundsToBbox,
  boundsToPolygon,
  normalizeGeoBounds,
} from '@/lib/services/copernicus/bounds';

describe('satellite-from-metrics', () => {
  it('anchors grid average to provided NDVI', () => {
    const zone = MOCK_FIELDS[0].zones[0];
    const metrics = metricsFromZone(zone);
    const data = buildSatelliteDataFromMetrics('field-1', metrics, 20);
    const avg = getAverageValue(data.ndvi);
    expect(Math.abs(avg - metrics.ndvi)).toBeLessThan(0.05);
  });

  it('uses real Copernicus grid when provided', () => {
    const zone = MOCK_FIELDS[0].zones[0];
    const metrics = metricsFromZone(zone);
    const realGrid = {
      size: 2,
      ndvi: [
        [0.7, 0.8],
        [0.6, 0.75],
      ],
      ndmi: [
        [0.4, 0.5],
        [0.3, 0.45],
      ],
      min: 0.6,
      max: 0.8,
    };
    const data = buildSatelliteDataFromMetrics('field-1', metrics, 20, realGrid);
    expect(data.isRealGrid).toBe(true);
    expect(data.ndvi[0][0]).toBe(0.7);
  });
});

describe('copernicus bounds', () => {
  it('converts field bounds to bbox and polygon', () => {
    const bounds = MOCK_FIELDS[0].bounds;
    const bbox = boundsToBbox(bounds);
    expect(bbox[0]).toBeLessThan(bbox[2]);
    expect(bbox[1]).toBeLessThan(bbox[3]);

    const polygon = boundsToPolygon(bounds);
    expect(polygon.length).toBe(5);
    expect(polygon[0]).toEqual(polygon[polygon.length - 1]);
  });

  it('normalizes GeoJSON polygon from Postgres seed', () => {
    const center = { lat: -34.9, lng: -62.3 };
    const geoJson = {
      type: 'Polygon' as const,
      coordinates: [
        [
          [-62.32, -34.92],
          [-62.28, -34.92],
          [-62.28, -34.88],
          [-62.32, -34.88],
          [-62.32, -34.92],
        ],
      ],
    };
    const bounds = normalizeGeoBounds(geoJson, center);
    expect(bounds).toHaveLength(4);
    expect(bounds[0].lat).toBeCloseTo(-34.88, 1);
  });
});

describe('satellite credentials', () => {
  it('returns false when no env vars set', () => {
    expect(hasSatelliteCredentials()).toBe(false);
  });
});

describe('serialize-field', () => {
  it('round-trips field data through JSON', () => {
    const original = MOCK_FIELDS[0];
    const json = serializeField(original);
    const restored = deserializeField(json);
    expect(restored.id).toBe(original.id);
    expect(restored.zones.length).toBe(original.zones.length);
    expect(restored.plantedDate).toBeInstanceOf(Date);
  });
});
