import type { GeoBounds } from '@/lib/types/field';

export interface SvgProjection {
  width: number;
  height: number;
  padding: number;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export function boundsFromPoints(points: GeoBounds): SvgProjection & {
  project: (lat: number, lng: number) => { x: number; y: number };
  polygonPoints: (bounds: GeoBounds) => string;
} {
  const minLat = Math.min(...points.map((p) => p.lat));
  const maxLat = Math.max(...points.map((p) => p.lat));
  const minLng = Math.min(...points.map((p) => p.lng));
  const maxLng = Math.max(...points.map((p) => p.lng));

  const width = 320;
  const height = 200;
  const padding = 16;

  const project = (lat: number, lng: number) => {
    const x =
      ((lng - minLng) / Math.max(maxLng - minLng, 1e-9)) * (width - 2 * padding) +
      padding;
    const y =
      height -
      padding -
      ((lat - minLat) / Math.max(maxLat - minLat, 1e-9)) * (height - 2 * padding);
    return { x, y };
  };

  const polygonPoints = (bounds: GeoBounds) =>
    bounds
      .map((p) => {
        const { x, y } = project(p.lat, p.lng);
        return `${x},${y}`;
      })
      .join(' ');

  return {
    width,
    height,
    padding,
    minLat,
    maxLat,
    minLng,
    maxLng,
    project,
    polygonPoints,
  };
}
