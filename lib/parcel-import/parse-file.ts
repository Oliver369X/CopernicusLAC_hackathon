import type { ImportParcel, ImportError } from './types';
import { parseParcelGeoJson } from './parse-geojson';
import { parseParcelKml } from './parse-kml';
import { parseParcelKmz } from './parse-kmz';
import { parseParcelCsv } from './parse-csv-parcels';
import { parseParcelShapefileZip } from './parse-shapefile';

export async function parseImportFile(
  filename: string,
  buffer: ArrayBuffer,
  mime: string
): Promise<{ parcels: ImportParcel[]; errors: ImportError[] }> {
  const lower = filename.toLowerCase();

  if (lower.endsWith('.gpkg')) {
    return {
      parcels: [],
      errors: [
        {
          code: 'PARSE_ERROR',
          message:
            'GeoPackage (.gpkg): en QGIS usá Exportar → GeoJSON o Shapefile (.zip). EPSG:4326.',
        },
      ],
    };
  }

  if (lower.endsWith('.kmz')) {
    return parseParcelKmz(buffer);
  }

  if (lower.endsWith('.kml') || mime.includes('kml')) {
    const text = new TextDecoder().decode(buffer);
    return parseParcelKml(text);
  }

  if (lower.endsWith('.csv') || mime.includes('csv')) {
    const text = new TextDecoder().decode(buffer);
    return parseParcelCsv(text);
  }

  if (
    lower.endsWith('.zip') ||
    mime.includes('zip') ||
    lower.endsWith('.shp')
  ) {
    const shp = await parseParcelShapefileZip(buffer);
    if (shp.parcels.length > 0 || shp.errors.every((e) => e.code !== 'PARSE_ERROR')) {
      return shp;
    }
    const kmz = parseParcelKmz(buffer);
    if (kmz.parcels.length > 0) return kmz;
    return shp;
  }

  const text = new TextDecoder().decode(buffer);
  return parseParcelGeoJson(text);
}
