import { describe, expect, it } from 'vitest';
import { createImportParcelFromPolygon } from '@/lib/parcel-import/create-from-polygon';

function squarePolygon(lng0: number, lat0: number, sizeDeg: number) {
  return {
    type: 'Polygon' as const,
    coordinates: [
      [
        [lng0, lat0],
        [lng0 + sizeDeg, lat0],
        [lng0 + sizeDeg, lat0 - sizeDeg],
        [lng0, lat0 - sizeDeg],
        [lng0, lat0],
      ],
    ],
  };
}

describe('createImportParcelFromPolygon', () => {
  it('acepta polígono válido ~8 ha', () => {
    const result = createImportParcelFromPolygon({
      name: 'Chacra Norte',
      crop: 'soybean',
      bounds: squarePolygon(-62.85, -16.95, 0.0028),
    });
    expect('parcel' in result).toBe(true);
    if ('parcel' in result) {
      expect(result.parcel.areaHa).toBeGreaterThan(5);
      expect(result.parcel.areaHa).toBeLessThan(12);
      expect(result.parcel.center.lat).toBeLessThan(0);
    }
  });

  it('rechaza polígono menor a 0.1 ha', () => {
    const result = createImportParcelFromPolygon({
      name: 'Mini',
      crop: 'corn',
      bounds: squarePolygon(-62.85, -16.95, 0.0002),
    });
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.code).toBe('AREA_TOO_SMALL');
    }
  });

  it('cierra el anillo automáticamente', () => {
    const openRing = {
      type: 'Polygon' as const,
      coordinates: [
        [
          [-62.85, -16.95],
          [-62.84, -16.95],
          [-62.84, -16.94],
          [-62.85, -16.94],
        ],
      ],
    };
    const result = createImportParcelFromPolygon({
      name: 'Abierto',
      crop: 'wheat',
      bounds: openRing,
    });
    expect('parcel' in result).toBe(true);
    if ('parcel' in result) {
      const ring = result.parcel.polygonRing ?? [];
      const first = ring[0];
      const last = ring[ring.length - 1];
      expect(first[0]).toBe(last[0]);
      expect(first[1]).toBe(last[1]);
    }
  });

  it('centroide cae dentro del bbox del polígono', () => {
    const result = createImportParcelFromPolygon({
      name: 'Centro',
      crop: 'soybean',
      bounds: squarePolygon(-62.85, -16.95, 0.0028),
    });
    expect('parcel' in result).toBe(true);
    if ('parcel' in result) {
      const { lat, lng } = result.parcel.center;
      expect(lat).toBeGreaterThan(-17);
      expect(lat).toBeLessThan(-16.9);
      expect(lng).toBeGreaterThan(-62.9);
      expect(lng).toBeLessThan(-62.8);
    }
  });
});
