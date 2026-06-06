import { area, centroid, polygon as turfPolygon } from '@turf/turf';
import type { Polygon } from 'geojson';
import type { CropType } from '@/lib/mock-data/crops';
import { normalizeGeoBounds } from '@/lib/services/copernicus/bounds';
import type { GeoBounds } from '@/lib/types/field';
import type { ImportError, ImportParcel } from './types';
import { MIN_AREA_HA } from './types';

export interface CreateParcelFromPolygonInput {
  name: string;
  crop: CropType;
  bounds: Polygon;
  plantingDate?: string;
  locationLabel?: string;
}

function closeRing(ring: number[][]): number[][] {
  if (ring.length < 3) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}

function uniqueVertexCount(ring: number[][]): number {
  const closed = closeRing(ring);
  return Math.max(0, closed.length - 1);
}

function roundHa(value: number): number {
  return Math.round(value * 100) / 100;
}

export function createImportParcelFromPolygon(
  input: CreateParcelFromPolygonInput
): { parcel: ImportParcel } | { error: ImportError } {
  const trimmedName = input.name.trim();
  if (trimmedName.length < 2) {
    return {
      error: {
        code: 'MISSING_NAME',
        message: 'El nombre de la parcela debe tener al menos 2 caracteres',
      },
    };
  }

  const rawRing = input.bounds.coordinates[0];
  if (!rawRing || !Array.isArray(rawRing)) {
    return {
      error: {
        code: 'INVALID_GEOMETRY',
        message: 'Polígono inválido: falta el anillo exterior',
      },
    };
  }

  const ring = closeRing(rawRing as number[][]);
  if (uniqueVertexCount(ring) < 3) {
    return {
      error: {
        code: 'INVALID_GEOMETRY',
        message: 'El polígono necesita al menos 3 vértices',
      },
    };
  }

  const closedPolygon: Polygon = {
    type: 'Polygon',
    coordinates: [ring],
  };

  let areaHa: number;
  let center: { lat: number; lng: number };
  try {
    const poly = turfPolygon(closedPolygon.coordinates);
    areaHa = roundHa(area(poly) / 10000);
    const cent = centroid(poly);
    const [lng, lat] = cent.geometry.coordinates;
    center = { lat, lng };
  } catch {
    return {
      error: {
        code: 'INVALID_GEOMETRY',
        message: 'No se pudo calcular el área del polígono',
      },
    };
  }

  if (areaHa < MIN_AREA_HA) {
    return {
      error: {
        code: 'AREA_TOO_SMALL',
        message: `El área (${areaHa} ha) es menor al mínimo de ${MIN_AREA_HA} ha`,
      },
    };
  }

  let geoBounds: GeoBounds;
  try {
    geoBounds = normalizeGeoBounds(closedPolygon, center);
  } catch {
    return {
      error: {
        code: 'INVALID_GEOMETRY',
        message: 'No se pudo normalizar la geometría del polígono',
      },
    };
  }

  return {
    parcel: {
      name: trimmedName,
      crop: input.crop,
      areaHa,
      plantingDate: input.plantingDate,
      locationLabel: input.locationLabel,
      bounds: geoBounds,
      polygonRing: ring,
      center,
    },
  };
}
