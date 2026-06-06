import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseParcelGeoJson } from '@/lib/parcel-import/parse-geojson';
import { validateImportParcels } from '@/lib/parcel-import/validate-import';

const fixture = join(process.cwd(), 'tests/fixtures/parcels/demo.geojson');

describe('parseParcelGeoJson', () => {
  it('parses demo geojson with 3 parcels', () => {
    const text = readFileSync(fixture, 'utf8');
    const { parcels, errors } = parseParcelGeoJson(text);
    expect(errors).toHaveLength(0);
    expect(parcels.length).toBe(3);
    const preview = validateImportParcels(parcels, errors);
    expect(preview.fields.length).toBe(3);
  });

  it('splits MultiPolygon into one parcel per polygon (QGIS export)', () => {
    const multi = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { nombre: 'Lote Norte' },
          geometry: {
            type: 'MultiPolygon',
            coordinates: [
              [
                [
                  [-63.15, -17.78],
                  [-63.14, -17.78],
                  [-63.14, -17.77],
                  [-63.15, -17.77],
                  [-63.15, -17.78],
                ],
              ],
              [
                [
                  [-63.13, -17.78],
                  [-63.12, -17.78],
                  [-63.12, -17.77],
                  [-63.13, -17.77],
                  [-63.13, -17.78],
                ],
              ],
            ],
          },
        },
      ],
    };
    const { parcels, errors } = parseParcelGeoJson(JSON.stringify(multi));
    expect(errors).toHaveLength(0);
    expect(parcels.length).toBe(2);
    expect(parcels[0].name).toContain('Lote Norte');
    expect(parcels[1].name).toContain('parte 2');
    parcels.forEach((p) => expect(p.areaHa).toBeGreaterThan(0));
  });
});
