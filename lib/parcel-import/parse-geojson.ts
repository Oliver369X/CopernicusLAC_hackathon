import type { GeoBounds } from '@/lib/types/field';
import { normalizeGeoBounds } from '@/lib/services/copernicus/bounds';
import { boundsCentroid } from '@/lib/services/copernicus/bounds';
import type { ImportParcel, ImportError } from './types';
import { normalizeCropOrDefault } from './normalize-crop';

interface GeoFeature {
  type: string;
  properties?: Record<string, unknown>;
  geometry?: {
    type: string;
    coordinates?: number[][][] | number[][];
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

function featureToParcel(f: GeoFeature, index: number): {
  parcel: ImportParcel | null;
  error: ImportError | null;
} {
  const props = f.properties ?? {};
  const name = propStr(props, 'name', 'nombre', 'NAME', 'lote') ?? `Lote ${index + 1}`;
  const crop = normalizeCropOrDefault(propStr(props, 'crop', 'crop_type', 'cultivo', 'CULTIVO'));
  const geom = f.geometry;
  if (!geom || geom.type !== 'Polygon' || !Array.isArray(geom.coordinates?.[0])) {
    return {
      parcel: null,
      error: {
        code: 'INVALID_GEOMETRY',
        featureIndex: index,
        message: `${name}: se requiere polígono`,
      },
    };
  }
  const ring = geom.coordinates[0] as number[][];
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
  const areaHa = Number(propStr(props, 'area_ha', 'area', 'AREA') ?? 0) || estimateAreaHa(bounds);

  return {
    parcel: {
      name,
      crop,
      areaHa,
      plantingDate: propStr(props, 'planting_date', 'fecha_siembra', 'siembra'),
      locationLabel: propStr(props, 'location', 'ubicacion'),
      bounds,
      zoneName: propStr(props, 'zone_name', 'zona'),
      center,
    },
    error: null,
  };
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
  const geo = JSON.parse(text) as { type: string; features?: GeoFeature[] };
  const features =
    geo.type === 'FeatureCollection'
      ? geo.features ?? []
      : geo.type === 'Feature'
        ? [geo as GeoFeature]
        : [];

  const parcels: ImportParcel[] = [];
  const errors: ImportError[] = [];

  features.forEach((f, index) => {
    const { parcel, error } = featureToParcel(f, index);
    if (error) errors.push(error);
    if (parcel) parcels.push(parcel);
  });

  return { parcels, errors };
}
