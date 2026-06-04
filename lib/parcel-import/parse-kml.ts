import type { ImportParcel, ImportError } from './types';
import { parseParcelGeoJson } from './parse-geojson';

/** Convierte KML básico a GeoJSON FeatureCollection y reutiliza parser. */
export function parseParcelKml(text: string): {
  parcels: ImportParcel[];
  errors: ImportError[];
} {
  const placemarks = [...text.matchAll(/<Placemark[\s\S]*?<\/Placemark>/gi)];
  const features: Array<{
    type: 'Feature';
    properties: Record<string, unknown>;
    geometry: { type: 'Polygon'; coordinates: number[][][] };
  }> = [];

  for (const block of placemarks) {
    const nameMatch = block[0].match(/<name>([^<]*)<\/name>/i);
    const cropMatch = block[0].match(
      /<SimpleData[^>]*name="(?:crop|cultivo|crop_type)"[^>]*>([^<]*)<\/SimpleData>/i
    );
    const coordMatch = block[0].match(/<coordinates>([\s\S]*?)<\/coordinates>/i);
    if (!coordMatch) continue;

    const pairs = coordMatch[1]
      .trim()
      .split(/\s+/)
      .map((t) => t.split(',').map(Number))
      .filter((p) => p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]));

    if (pairs.length < 3) continue;
    const ring = pairs.map(([lng, lat]) => [lng, lat]);
    if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
      ring.push([ring[0][0], ring[0][1]]);
    }

    features.push({
      type: 'Feature',
      properties: {
        name: nameMatch?.[1]?.trim(),
        crop: cropMatch?.[1]?.trim(),
      },
      geometry: { type: 'Polygon', coordinates: [ring] },
    });
  }

  if (!features.length) {
    return {
      parcels: [],
      errors: [
        {
          code: 'PARSE_ERROR',
          message: 'No se encontraron polígonos en el KML',
        },
      ],
    };
  }

  return parseParcelGeoJson(
    JSON.stringify({ type: 'FeatureCollection', features })
  );
}
