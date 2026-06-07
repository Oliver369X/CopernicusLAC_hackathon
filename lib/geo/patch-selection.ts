import type { GeoBounds } from '@/lib/types/field';
import { boundsToBbox } from '@/lib/services/copernicus/bounds';

export interface PatchSelection {
  row: number;
  col: number;
  ndvi: number;
  ndmi: number;
  ndviAvg3: number;
  lat: number;
  lng: number;
}

export function cellCenterLatLng(
  row: number,
  col: number,
  gridSize: number,
  bounds: GeoBounds
): { lat: number; lng: number } {
  const [west, south, east, north] = boundsToBbox(bounds);
  const lng = west + ((col + 0.5) / gridSize) * (east - west);
  const lat = north - ((row + 0.5) / gridSize) * (north - south);
  return { lat, lng };
}

export function neighborhoodAverage(
  grid: number[][],
  row: number,
  col: number,
  radius = 1
): number {
  const size = grid.length;
  let sum = 0;
  let count = 0;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const r = row + dy;
      const c = col + dx;
      if (r >= 0 && r < size && c >= 0 && c < size) {
        sum += grid[r][c];
        count += 1;
      }
    }
  }
  return count > 0 ? sum / count : 0;
}

export function esriWorldImageryUrl(
  bounds: GeoBounds,
  width = 512,
  height = 280
): string {
  const [west, south, east, north] = boundsToBbox(bounds);
  const bbox = `${west},${south},${east},${north}`;
  return (
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export` +
    `?bbox=${encodeURIComponent(bbox)}&bboxSR=4326&size=${width},${height}&format=png&f=image`
  );
}

export function copernicusTileUrl(
  bounds: GeoBounds,
  layer: 'ndvi' | 'ndre' | 'truecolor',
  width = 512,
  height = 280
): string {
  const bbox = boundsToBbox(bounds).join(',');
  return `/api/satellite/tiles?layer=${layer}&bbox=${bbox}&width=${width}&height=${height}`;
}

export function ndviToColor(ndvi: number): string {
  if (ndvi > 0.6) return '#22c55e';
  if (ndvi > 0.4) return '#84cc16';
  if (ndvi > 0.2) return '#eab308';
  return '#ef4444';
}
