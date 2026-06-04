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
});
