import { describe, expect, it } from 'vitest';
import { validateImportParcels } from '@/lib/parcel-import/validate-import';
import type { ImportParcel } from '@/lib/parcel-import/types';

const sampleParcel: ImportParcel = {
  name: 'Chacra',
  crop: 'soybean',
  areaHa: 8,
  bounds: [
    { lat: -16.97, lng: -62.84 },
    { lat: -16.97, lng: -62.83 },
    { lat: -16.96, lng: -62.83 },
    { lat: -16.96, lng: -62.84 },
  ],
  center: { lat: -16.965, lng: -62.835 },
};

describe('validateImportParcels zoneCount', () => {
  it('usa effectiveZoneSplit=1 para pequeña agricultora', () => {
    const preview = validateImportParcels([sampleParcel], [], 1);
    expect(preview.fields[0]?.zoneCount).toBe(1);
  });

  it('usa effectiveZoneSplit=4 para cooperativa', () => {
    const preview = validateImportParcels([sampleParcel], [], 4);
    expect(preview.fields[0]?.zoneCount).toBe(4);
  });
});
