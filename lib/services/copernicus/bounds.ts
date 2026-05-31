import type { GeoBounds, GeoPoint } from '@/lib/types/field';
import { generateBoundsFromCenter } from '@/lib/types/field';

type GeoJsonPolygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

/** Acepta GeoBounds, GeoJSON Polygon (seed DB) o objeto vacío → usa centro. */
export function normalizeGeoBounds(
  raw: unknown,
  fallbackCenter?: GeoPoint
): GeoBounds {
  if (Array.isArray(raw) && raw.length >= 4) {
    const first = raw[0] as GeoPoint;
    if (typeof first?.lat === 'number' && typeof first?.lng === 'number') {
      return raw as GeoBounds;
    }
  }

  if (
    raw &&
    typeof raw === 'object' &&
    (raw as GeoJsonPolygon).type === 'Polygon' &&
    Array.isArray((raw as GeoJsonPolygon).coordinates?.[0])
  ) {
    const ring = (raw as GeoJsonPolygon).coordinates[0];
    const points = ring.map(([lng, lat]) => ({ lat, lng }));
    if (points.length >= 4) {
      return pointsToBounds(points);
    }
  }

  if (fallbackCenter) {
    return generateBoundsFromCenter(fallbackCenter);
  }

  throw new Error('Invalid or missing field bounds');
}

function pointsToBounds(points: GeoPoint[]): GeoBounds {
  const lngs = points.map((p) => p.lng);
  const lats = points.map((p) => p.lat);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  return [
    { lat: north, lng: west },
    { lat: north, lng: east },
    { lat: south, lng: east },
    { lat: south, lng: west },
  ];
}

export function boundsCentroid(bounds: GeoBounds): GeoPoint {
  const normalized = normalizeGeoBounds(bounds);
  const lat = normalized.reduce((s, p) => s + p.lat, 0) / normalized.length;
  const lng = normalized.reduce((s, p) => s + p.lng, 0) / normalized.length;
  return { lat, lng };
}

export function boundsToBbox(
  bounds: GeoBounds | unknown,
  fallbackCenter?: GeoPoint
): [number, number, number, number] {
  const normalized = normalizeGeoBounds(bounds, fallbackCenter);
  const lats = normalized.map((p) => p.lat);
  const lngs = normalized.map((p) => p.lng);
  return [
    Math.min(...lngs),
    Math.min(...lats),
    Math.max(...lngs),
    Math.max(...lats),
  ];
}

/** GeoJSON polygon coordinates [lng, lat] closed ring */
export function boundsToPolygon(bounds: GeoBounds | unknown, fallbackCenter?: GeoPoint): number[][] {
  const normalized = normalizeGeoBounds(bounds, fallbackCenter);
  const ring = normalized.map((p) => [p.lng, p.lat]);
  ring.push([normalized[0].lng, normalized[0].lat]);
  return ring;
}

export function timeRangeLastDays(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: from.toISOString(), to: to.toISOString() };
}
