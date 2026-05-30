import type { CropType } from '@/lib/mock-data/crops';

export type HealthStatus = 'excellent' | 'good' | 'warning' | 'critical';

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** NW, NE, SE, SW corners */
export type GeoBounds = [GeoPoint, GeoPoint, GeoPoint, GeoPoint];

export interface FieldZone {
  id: string;
  name: string;
  fieldId: string;
  area: number;
  bounds: GeoBounds;
  crop: CropType;
  health: HealthStatus;
  ndviAverage: number;
  ndmiAverage: number;
  temperatureAverage: number;
  soilMoistureAverage: number;
  observationCount: number;
  diseaseRisks: string[];
  lastObservation: Date;
  lastUpdate: Date;
}

export interface Field {
  id: string;
  name: string;
  locationLabel: string;
  center: GeoPoint;
  bounds: GeoBounds;
  area: number;
  crop: CropType;
  plantedDate: Date;
  daysFromPlanting: number;
  zones: FieldZone[];
  overallHealth: HealthStatus;
  lastUpdate: Date;
  notifications: number;
  riskScore: number;
}

export function generateBoundsFromCenter(
  center: GeoPoint,
  sizeDeg = 0.02
): GeoBounds {
  const { lat, lng } = center;
  const half = sizeDeg / 2;
  return [
    { lat: lat + half, lng: lng - half },
    { lat: lat + half, lng: lng + half },
    { lat: lat - half, lng: lng + half },
    { lat: lat - half, lng: lng - half },
  ];
}

export function generateZoneBounds(
  fieldBounds: GeoBounds,
  index: number,
  total: number
): GeoBounds {
  const [nw, ne, se, sw] = fieldBounds;
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;
  const rows = Math.ceil(total / cols);

  const latSpan = (nw.lat - sw.lat) / rows;
  const lngSpan = (ne.lng - nw.lng) / cols;

  const zoneNwLat = nw.lat - row * latSpan;
  const zoneNwLng = nw.lng + col * lngSpan;
  const zoneSeLat = zoneNwLat - latSpan;
  const zoneSeLng = zoneNwLng + lngSpan;

  return [
    { lat: zoneNwLat, lng: zoneNwLng },
    { lat: zoneNwLat, lng: zoneSeLng },
    { lat: zoneSeLat, lng: zoneSeLng },
    { lat: zoneSeLat, lng: zoneNwLng },
  ];
}

export function inferZoneHealth(
  ndvi: number,
  soilMoisture: number
): HealthStatus {
  if (ndvi < 0.35 || soilMoisture < 40) return 'critical';
  if (ndvi < 0.5 || soilMoisture < 55) return 'warning';
  if (ndvi >= 0.65 && soilMoisture >= 60) return 'excellent';
  return 'good';
}

export function getDaysToMaturity(
  cropCycleLength: number,
  daysFromPlanting: number
): number {
  return Math.max(0, cropCycleLength - daysFromPlanting);
}
