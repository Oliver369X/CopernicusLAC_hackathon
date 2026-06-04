import type { ImportParcel, ImportError } from './types';
import { parseParcelGeoJson } from './parse-geojson';

export async function parseParcelShapefileZip(
  buffer: ArrayBuffer
): Promise<{ parcels: ImportParcel[]; errors: ImportError[] }> {
  try {
    const shp = await import('shpjs');
    const geojson = await shp.default(buffer);
    const collection = Array.isArray(geojson) ? geojson[0] : geojson;
    return parseParcelGeoJson(JSON.stringify(collection));
  } catch (e) {
    return {
      parcels: [],
      errors: [
        {
          code: 'PARSE_ERROR',
          message: `Shapefile inválido: ${e instanceof Error ? e.message : 'error'}`,
        },
      ],
    };
  }
}
