import { area, polygon as turfPolygon } from '@turf/turf';
import type { GeoBounds } from '@/lib/types/field';
import { normalizeGeoBounds, boundsCentroid } from '@/lib/services/copernicus/bounds';
import type { ImportParcel, ImportError } from './types';
import { normalizeCropOrDefault } from './normalize-crop';

interface GeoFeature {
  type: string;
  properties?: Record<string, unknown>;
  geometry?: {
    type: string;
    coordinates?: number[][][] | number[][][][];
  };
}

function propStr(props: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = props[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return undefined;
}

function polygonToBounds(coords: number[][]): GeoBounds | null {
  if (coords.length < 4) return null;
  const points = coords.map(([lng, lat]) => ({ lat, lng }));
  return normalizeGeoBounds(
    { type: 'Polygon', coordinates: [coords] },
    points[0]
  );
}

function ringAreaHa(ring: number[][]): number {
  try {
    const poly = turfPolygon([ring]);
    return Math.round((area(poly) / 10000) * 100) / 100;
  } catch {
    return 0;
  }
}

function parcelFromRing(
  ring: number[][],
  props: Record<string, unknown>,
  baseName: string,
  index: number,
  partIndex?: number
): { parcel: ImportParcel | null; error: ImportError | null } {
  const suffix = partIndex != null && partIndex > 0 ? ` — parte ${partIndex + 1}` : '';
  const name =
    propStr(props, 'name', 'nombre', 'NAME', 'lote', 'parcela', 'field') ??
    (index > 0 || suffix ? `${baseName}${suffix}` : baseName);
  const crop = normalizeCropOrDefault(
    propStr(props, 'crop', 'crop_type', 'cultivo', 'CULTIVO', 'CULTIVO_')
  );
  const bounds = polygonToBounds(ring);
  if (!bounds) {
    return {
      parcel: null,
      error: {
        code: 'INVALID_GEOMETRY',
        featureIndex: index,
        message: `${name}: polígono inválido`,
      },
    };
  }
  const center = boundsCentroid(bounds);
  const propArea = Number(propStr(props, 'area_ha', 'area', 'AREA', 'hectareas') ?? 0);
  const areaHa = propArea > 0 ? propArea : ringAreaHa(ring) || estimateAreaHa(bounds);

  return {
    parcel: {
      name: partIndex != null && partIndex > 0 ? `${baseName}${suffix}` : name,
      crop,
      areaHa,
      plantingDate: propStr(props, 'planting_date', 'fecha_siembra', 'siembra'),
      locationLabel: propStr(props, 'location', 'ubicacion', 'municipio'),
      bounds,
      polygonRing: ring[0][0] === ring[ring.length - 1][0] ? ring : [...ring, ring[0]],
      zoneName: propStr(props, 'zone_name', 'zona'),
      center,
    },
    error: null,
  };
}

function featureToParcels(
  f: GeoFeature,
  index: number
): { parcels: ImportParcel[]; errors: ImportError[] } {
  const props = f.properties ?? {};
  const baseName =
    propStr(props, 'name', 'nombre', 'NAME', 'lote', 'parcela') ?? `Lote ${index + 1}`;
  const geom = f.geometry;
  const parcels: ImportParcel[] = [];
  const errors: ImportError[] = [];

  if (!geom) {
    errors.push({
      code: 'INVALID_GEOMETRY',
      featureIndex: index,
      message: `${baseName}: sin geometría`,
    });
    return { parcels, errors };
  }

  if (geom.type === 'Polygon' && Array.isArray(geom.coordinates?.[0])) {
    const ring = geom.coordinates[0] as number[][];
    const { parcel, error } = parcelFromRing(ring, props, baseName, index);
    if (error) errors.push(error);
    if (parcel) parcels.push(parcel);
    return { parcels, errors };
  }

  if (geom.type === 'MultiPolygon' && Array.isArray(geom.coordinates)) {
    const polys = geom.coordinates as number[][][][];
    polys.forEach((polyCoords, partIndex) => {
      const ring = polyCoords[0];
      if (!ring) return;
      const { parcel, error } = parcelFromRing(ring, props, baseName, index, partIndex);
      if (error) errors.push(error);
      if (parcel) parcels.push(parcel);
    });
    if (parcels.length === 0 && errors.length === 0) {
      errors.push({
        code: 'INVALID_GEOMETRY',
        featureIndex: index,
        message: `${baseName}: MultiPolygon vacío`,
      });
    }
    return { parcels, errors };
  }

  errors.push({
    code: 'INVALID_GEOMETRY',
    featureIndex: index,
    message: `${baseName}: se requiere Polygon o MultiPolygon (exportá desde QGIS como GeoJSON)`,
  });
  return { parcels, errors };
}

function estimateAreaHa(bounds: GeoBounds): number {
  const [nw, , se] = bounds;
  const latKm = Math.abs(nw.lat - se.lat) * 111;
  const lngKm =
    Math.abs((bounds[1]?.lng ?? nw.lng) - nw.lng) *
    111 *
    Math.cos((nw.lat * Math.PI) / 180);
  return Math.round(latKm * lngKm * 100) / 100 || 1;
}

export function parseParcelGeoJson(text: string): {
  parcels: ImportParcel[];
  errors: ImportError[];
} {
  let geo: { type: string; features?: GeoFeature[] };
  try {
    geo = JSON.parse(text) as { type: string; features?: GeoFeature[] };
  } catch {
    return {
      parcels: [],
      errors: [{ code: 'PARSE_ERROR', message: 'JSON inválido' }],
    };
  }

  const features =
    geo.type === 'FeatureCollection'
      ? geo.features ?? []
      : geo.type === 'Feature'
        ? [geo as GeoFeature]
        : geo.type === 'Polygon' || geo.type === 'MultiPolygon'
          ? [
              {
                type: 'Feature',
                properties: {},
                geometry: geo as GeoFeature['geometry'],
              },
            ]
          : [];

  const parcels: ImportParcel[] = [];
  const errors: ImportError[] = [];

  features.forEach((f, index) => {
    const result = featureToParcels(f, index);
    errors.push(...result.errors);
    parcels.push(...result.parcels);
  });

  return { parcels, errors };
}
