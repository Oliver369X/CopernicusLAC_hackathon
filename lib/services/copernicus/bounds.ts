import type { GeoBounds, GeoPoint } from '@/lib/types/field';

export function boundsCentroid(bounds: GeoBounds): GeoPoint {
  const lat = bounds.reduce((s, p) => s + p.lat, 0) / bounds.length;
  const lng = bounds.reduce((s, p) => s + p.lng, 0) / bounds.length;
  return { lat, lng };
}

export function boundsToBbox(bounds: GeoBounds): [number, number, number, number] {
  const lats = bounds.map((p) => p.lat);
  const lngs = bounds.map((p) => p.lng);
  return [
    Math.min(...lngs),
    Math.min(...lats),
    Math.max(...lngs),
    Math.max(...lats),
  ];
}

/** GeoJSON polygon coordinates [lng, lat] closed ring */
export function boundsToPolygon(bounds: GeoBounds): number[][] {
  const ring = bounds.map((p) => [p.lng, p.lat]);
  ring.push([bounds[0].lng, bounds[0].lat]);
  return ring;
}

export function timeRangeLastDays(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: from.toISOString(), to: to.toISOString() };
}
