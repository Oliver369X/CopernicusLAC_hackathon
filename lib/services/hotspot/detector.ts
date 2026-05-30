import type { GeoBounds } from '@/lib/types/field';
import { boundsToBbox } from '@/lib/services/copernicus/bounds';

export interface Hotspot {
  lat: number;
  lng: number;
  value: number;
  gridX: number;
  gridY: number;
}

/** Find minimum NDVI/NDRE cell and map to lat/lng within zone bounds. */
export function detectHotspotFromGrid(
  bounds: GeoBounds,
  grid: number[][],
  mode: 'min' | 'max' = 'min'
): Hotspot | null {
  if (!grid.length || !grid[0]?.length) return null;

  const [west, south, east, north] = boundsToBbox(bounds);
  const rows = grid.length;
  const cols = grid[0].length;

  let bestVal = mode === 'min' ? Infinity : -Infinity;
  let bestY = 0;
  let bestX = 0;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const v = grid[y][x];
      if (Number.isNaN(v)) continue;
      if (mode === 'min' ? v < bestVal : v > bestVal) {
        bestVal = v;
        bestY = y;
        bestX = x;
      }
    }
  }

  if (!Number.isFinite(bestVal)) return null;

  const lng = west + ((bestX + 0.5) / cols) * (east - west);
  const lat = north - ((bestY + 0.5) / rows) * (north - south);

  return {
    lat,
    lng,
    value: bestVal,
    gridX: bestX,
    gridY: bestY,
  };
}

export function buildCaptureDeeplink(
  fieldId: string,
  zoneId: string,
  hotspot: Hotspot
): string {
  const params = new URLSearchParams({
    field: fieldId,
    zoneId,
    lat: hotspot.lat.toFixed(6),
    lng: hotspot.lng.toFixed(6),
  });
  return `/field/capture?${params.toString()}`;
}
