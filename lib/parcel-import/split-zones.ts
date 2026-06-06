import { randomUUID } from 'crypto';
import type { ImportParcel } from './types';
import { generateZoneBounds, inferZoneHealth } from '@/lib/types/field';
import { geoBoundsToStorage } from '@/lib/geo/bounds-utils';
import type { CropType } from '@/lib/mock-data/crops';

export interface PersistZoneRow {
  id: string;
  field_id: string;
  name: string;
  area_ha: number;
  bounds: ReturnType<typeof geoBoundsToStorage>;
  health: string;
  ndvi_average: number;
  ndmi_average: number;
  temperature_average: number;
  soil_moisture_average: number;
  observation_count: number;
  disease_risks: string[];
}

export interface PersistFieldRow {
  id: string;
  org_id: string;
  name: string;
  crop_type: CropType;
  area_ha: number;
  center_lat: number;
  center_lng: number;
  bounds: ReturnType<typeof geoBoundsToStorage>;
  location_label: string | null;
  planting_date: string | null;
  days_from_planting: number;
  overall_health: string;
  risk_score: number;
  notifications: number;
}

export function buildFieldAndZones(
  parcel: ImportParcel,
  orgId: string,
  zoneSplitCount: number
): { field: PersistFieldRow; zones: PersistZoneRow[] } {
  const fieldId = randomUUID();
  const fieldBoundsStorage = parcel.polygonRing
    ? { type: 'Polygon' as const, coordinates: [parcel.polygonRing] }
    : geoBoundsToStorage(parcel.bounds);
  const planted = parcel.plantingDate ?? new Date().toISOString().slice(0, 10);
  const plantedDate = new Date(planted);
  const days = Math.max(
    0,
    Math.floor((Date.now() - plantedDate.getTime()) / (86400 * 1000))
  );

  const field: PersistFieldRow = {
    id: fieldId,
    org_id: orgId,
    name: parcel.name,
    crop_type: parcel.crop,
    area_ha: parcel.areaHa,
    center_lat: parcel.center.lat,
    center_lng: parcel.center.lng,
    bounds: fieldBoundsStorage,
    location_label: parcel.locationLabel ?? null,
    planting_date: planted,
    days_from_planting: days,
    overall_health: 'good',
    risk_score: 30,
    notifications: 0,
  };

  const zones: PersistZoneRow[] = [];
  const count = parcel.zoneName ? 1 : zoneSplitCount;

  for (let i = 0; i < count; i++) {
    const zb = generateZoneBounds(parcel.bounds, i, count);
    const areaSlice = parcel.areaHa / count;
    const zoneBoundsStorage =
      count === 1 && parcel.polygonRing
        ? { type: 'Polygon' as const, coordinates: [parcel.polygonRing] }
        : geoBoundsToStorage(zb);
    zones.push({
      id: randomUUID(),
      field_id: fieldId,
      name: parcel.zoneName ?? (count === 1 ? `Parcela completa — ${parcel.name}` : `${parcel.name} — Zona ${i + 1}`),
      area_ha: areaSlice,
      bounds: zoneBoundsStorage,
      health: inferZoneHealth(0.55, 65),
      ndvi_average: 0.55,
      ndmi_average: 0.4,
      temperature_average: 25,
      soil_moisture_average: 65,
      observation_count: 0,
      disease_risks: [],
    });
  }

  return { field, zones };
}
