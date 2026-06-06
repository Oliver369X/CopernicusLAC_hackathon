import { describe, expect, it } from 'vitest';
import { createImportParcelFromPolygon } from '@/lib/parcel-import/create-from-polygon';

describe('POST /api/fields payload validation', () => {
  it('rechaza nombre corto vía createImportParcelFromPolygon', () => {
    const result = createImportParcelFromPolygon({
      name: 'A',
      crop: 'soybean',
      bounds: {
        type: 'Polygon',
        coordinates: [
          [
            [-62.85, -16.95],
            [-62.84, -16.95],
            [-62.84, -16.94],
            [-62.85, -16.94],
            [-62.85, -16.95],
          ],
        ],
      },
    });
    expect('error' in result).toBe(true);
  });

  it('acepta polígono válido para persist pipeline', () => {
    const result = createImportParcelFromPolygon({
      name: 'Parcela Demo',
      crop: 'corn',
      bounds: {
        type: 'Polygon',
        coordinates: [
          [
            [-62.85, -16.95],
            [-62.84, -16.95],
            [-62.84, -16.94],
            [-62.85, -16.94],
            [-62.85, -16.95],
          ],
        ],
      },
    });
    expect('parcel' in result).toBe(true);
    if ('parcel' in result) {
      expect(result.parcel.polygonRing).toBeDefined();
      expect(result.parcel.areaHa).toBeGreaterThan(0);
    }
  });
});
