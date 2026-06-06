import { isScienceCrop } from '@/lib/science/crops/registry';
import type { CropType } from '@/lib/mock-data/crops';
import type { ImportParcel, ImportError, ImportPreview } from './types';
import { MAX_IMPORT_FEATURES, MIN_AREA_HA } from './types';

export function validateImportParcels(
  parcels: ImportParcel[],
  errors: ImportError[],
  effectiveZoneSplit = 4
): ImportPreview {
  const allErrors = [...errors];

  if (parcels.length > MAX_IMPORT_FEATURES) {
    allErrors.push({
      code: 'TOO_MANY_FEATURES',
      message: `Máximo ${MAX_IMPORT_FEATURES} lotes por archivo`,
    });
    return { fields: [], parcels: [], errors: allErrors, warnings: [] };
  }

  const warnings: string[] = [];
  const valid: ImportParcel[] = [];

  parcels.forEach((p, index) => {
    if (!p.name.trim()) {
      allErrors.push({
        code: 'MISSING_NAME',
        featureIndex: index,
        message: `Fila ${index + 1}: nombre requerido`,
      });
      return;
    }
    if (p.areaHa < MIN_AREA_HA) {
      allErrors.push({
        code: 'AREA_TOO_SMALL',
        featureIndex: index,
        message: `${p.name}: área menor a ${MIN_AREA_HA} ha`,
      });
      return;
    }
    const cropOk =
      isScienceCrop(p.crop) ||
      ['cotton', 'sunflower', 'canola', 'barley', 'rice'].includes(p.crop);
    if (!cropOk) {
      allErrors.push({
        code: 'UNKNOWN_CROP',
        featureIndex: index,
        message: `${p.name}: cultivo no reconocido (${p.crop})`,
      });
      return;
    }
    valid.push(p);
  });

  const fields = valid.map((p, i) => ({
    tempId: `preview-${i}`,
    name: p.name,
    crop: p.crop as CropType,
    areaHa: p.areaHa,
    zoneCount: p.zoneName ? 1 : effectiveZoneSplit,
    warnings: [],
  }));

  return { fields, parcels: valid, errors: allErrors, warnings };
}
