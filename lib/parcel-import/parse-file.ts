import type { ImportParcel, ImportError } from './types';
import { parseParcelGeoJson } from './parse-geojson';
import { parseParcelKml } from './parse-kml';
import { parseParcelCsv } from './parse-csv-parcels';
import { parseParcelShapefileZip } from './parse-shapefile';

export async function parseImportFile(
  filename: string,
  buffer: ArrayBuffer,
  mime: string
): Promise<{ parcels: ImportParcel[]; errors: ImportError[] }> {
  const lower = filename.toLowerCase();
  const text = new TextDecoder().decode(buffer);

  if (
    lower.endsWith('.zip') ||
    mime.includes('zip') ||
    lower.endsWith('.shp')
  ) {
    return parseParcelShapefileZip(buffer);
  }
  if (lower.endsWith('.kml') || mime.includes('kml')) {
    return parseParcelKml(text);
  }
  if (lower.endsWith('.csv') || mime.includes('csv')) {
    return parseParcelCsv(text);
  }
  return parseParcelGeoJson(text);
}
