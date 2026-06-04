import type { GeoBounds, GeoPoint } from '@/lib/types/field';
import { generateZoneBounds } from '@/lib/types/field';
import { boundsToPolygon, normalizeGeoBounds } from '@/lib/services/copernicus/bounds';

export function isEmptyBounds(raw: unknown): boolean {
  if (raw == null) return true;
  if (typeof raw === 'string') {
    const t = raw.trim();
    return t === '' || t === '{}';
  }
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Object.keys(o).length === 0) return true;
    if (o.type === 'Polygon' && Array.isArray(o.coordinates)) {
      const ring = (o.coordinates as number[][][])[0];
      return !ring || ring.length < 4;
    }
  }
  return false;
}

export function deriveZoneBounds(
  fieldBoundsRaw: unknown,
  fieldCenter: GeoPoint,
  zoneIndex: number,
  totalZones: number
): GeoBounds {
  const fieldBounds = normalizeGeoBounds(fieldBoundsRaw, fieldCenter);
  return generateZoneBounds(fieldBounds, zoneIndex, totalZones);
}

export function geoBoundsToStorage(bounds: GeoBounds): {
  type: 'Polygon';
  coordinates: number[][][];
} {
  const ring = boundsToPolygon(bounds);
  return { type: 'Polygon', coordinates: [ring] };
}

export function hasValidZoneBounds(raw: unknown, fieldCenter?: GeoPoint): boolean {
  if (isEmptyBounds(raw)) return false;
  try {
    normalizeGeoBounds(raw, fieldCenter);
    return true;
  } catch {
    return false;
  }
}
