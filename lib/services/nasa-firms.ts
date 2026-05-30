import type { Field, GeoBounds } from '@/lib/types/field';
import { boundsToBbox } from './copernicus/bounds';

export interface FireHotspot {
  lat: number;
  lng: number;
  confidence: number;
  satellite: string;
  detectedAt: string;
}

export interface FireProximityAlert {
  fieldId: string;
  fieldName: string;
  distanceKm: number;
  hotspot: FireHotspot;
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseFirmsCsv(csv: string): FireHotspot[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const header = lines[0].split(',');
  const latIdx = header.indexOf('latitude');
  const lngIdx = header.indexOf('longitude');
  const confIdx = header.indexOf('confidence');
  const satIdx = header.indexOf('satellite');
  const dateIdx = header.indexOf('acq_date');
  const timeIdx = header.indexOf('acq_time');

  if (latIdx < 0 || lngIdx < 0) return [];

  const hotspots: FireHotspot[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const lat = parseFloat(cols[latIdx]);
    const lng = parseFloat(cols[lngIdx]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

    const date = cols[dateIdx] ?? '';
    const time = cols[timeIdx] ?? '0000';
    const detectedAt = date
      ? new Date(`${date}T${time.padStart(4, '0').slice(0, 2)}:${time.padStart(4, '0').slice(2)}:00Z`).toISOString()
      : new Date().toISOString();

    hotspots.push({
      lat,
      lng,
      confidence: confIdx >= 0 ? parseFloat(cols[confIdx]) || 0 : 0,
      satellite: satIdx >= 0 ? cols[satIdx] : 'VIIRS',
      detectedAt,
    });
  }

  return hotspots;
}

export async function fetchFireHotspotsInBounds(
  bounds: GeoBounds,
  days = 1
): Promise<FireHotspot[]> {
  const mapKey = process.env.NASA_FIRMS_MAP_KEY;
  if (!mapKey) return [];

  const [west, south, east, north] = boundsToBbox(bounds);
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/VIIRS_SNPP_NRT/world/${west}/${south}/${east}/${north}/${days}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const csv = await res.text();
    return parseFirmsCsv(csv);
  } catch {
    return [];
  }
}

export function checkFireProximity(
  field: Field,
  hotspots: FireHotspot[],
  radiusKm?: number
): FireProximityAlert[] {
  const threshold = radiusKm ?? Number(process.env.FIRMS_ALERT_RADIUS_KM ?? 5);
  const alerts: FireProximityAlert[] = [];

  for (const hotspot of hotspots) {
    const distanceKm = haversineKm(
      field.center.lat,
      field.center.lng,
      hotspot.lat,
      hotspot.lng
    );
    if (distanceKm <= threshold) {
      alerts.push({
        fieldId: field.id,
        fieldName: field.name,
        distanceKm: Math.round(distanceKm * 10) / 10,
        hotspot,
      });
    }
  }

  return alerts.sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function fetchFireAlertsForField(
  field: Field
): Promise<FireProximityAlert[]> {
  const hotspots = await fetchFireHotspotsInBounds(field.bounds, 1);
  return checkFireProximity(field, hotspots);
}
