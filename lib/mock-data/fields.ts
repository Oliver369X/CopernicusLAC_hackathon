import { CROP_PROFILES, type CropType } from './crops';
import type { Field, FieldZone, GeoPoint } from '@/lib/types/field';
import {
  generateBoundsFromCenter,
  generateZoneBounds,
  inferZoneHealth,
} from '@/lib/types/field';

interface RawFieldInput {
  id: string;
  name: string;
  locationLabel: string;
  center: GeoPoint;
  area: number;
  crop: CropType;
  plantedDate: Date;
  daysFromPlanting: number;
  overallHealth: Field['overallHealth'];
  notifications: number;
  riskScore: number;
  zones: Array<{
    id: string;
    name: string;
    area: number;
    ndviAverage: number;
    ndmiAverage: number;
    temperatureAverage: number;
    soilMoistureAverage: number;
    observationCount: number;
    diseaseRisks: string[];
    lastObservation?: Date;
  }>;
}

function buildField(input: RawFieldInput): Field {
  const bounds = generateBoundsFromCenter(input.center);
  const now = new Date();

  const zones: FieldZone[] = input.zones.map((z, index) => ({
    id: z.id,
    name: z.name,
    fieldId: input.id,
    area: z.area,
    bounds: generateZoneBounds(bounds, index, input.zones.length),
    crop: input.crop,
    health: inferZoneHealth(z.ndviAverage, z.soilMoistureAverage),
    ndviAverage: z.ndviAverage,
    ndmiAverage: z.ndmiAverage,
    temperatureAverage: z.temperatureAverage,
    soilMoistureAverage: z.soilMoistureAverage,
    observationCount: z.observationCount,
    diseaseRisks: z.diseaseRisks,
    lastObservation: z.lastObservation ?? now,
    lastUpdate: z.lastObservation ?? now,
  }));

  return {
    id: input.id,
    name: input.name,
    locationLabel: input.locationLabel,
    center: input.center,
    bounds,
    area: input.area,
    crop: input.crop,
    plantedDate: input.plantedDate,
    daysFromPlanting: input.daysFromPlanting,
    zones,
    overallHealth: input.overallHealth,
    lastUpdate: now,
    notifications: input.notifications,
    riskScore: input.riskScore,
  };
}

const RAW_FIELDS: RawFieldInput[] = [
  {
    id: 'field-1',
    name: 'North Sector 1',
    locationLabel: 'Pampas Region',
    center: { lat: -34.9, lng: -62.3 },
    area: 150,
    crop: 'soybean',
    plantedDate: new Date('2024-09-15'),
    daysFromPlanting: 45,
    overallHealth: 'good',
    notifications: 2,
    riskScore: 35,
    zones: [
      { id: 'zone-1-a', name: 'Zone A1', area: 50, ndviAverage: 0.64, ndmiAverage: 0.47, temperatureAverage: 29.6, soilMoistureAverage: 73, observationCount: 12, diseaseRisks: [] },
      { id: 'zone-1-b', name: 'Zone A2', area: 50, ndviAverage: 0.55, ndmiAverage: 0.38, temperatureAverage: 30.2, soilMoistureAverage: 68, observationCount: 10, diseaseRisks: ['Powdery Mildew Risk'] },
      { id: 'zone-1-c', name: 'Zone A3', area: 50, ndviAverage: 0.58, ndmiAverage: 0.42, temperatureAverage: 28.9, soilMoistureAverage: 71, observationCount: 11, diseaseRisks: [] },
      { id: 'zone-1-d', name: 'Zone A4 — Estrés hídrico', area: 40, ndviAverage: 0.38, ndmiAverage: 0.22, temperatureAverage: 31.5, soilMoistureAverage: 48, observationCount: 6, diseaseRisks: ['Drought Stress', 'Water Deficit'] },
      { id: 'zone-1-e', name: 'Zone A5 — Recuperación', area: 40, ndviAverage: 0.62, ndmiAverage: 0.44, temperatureAverage: 28.5, soilMoistureAverage: 72, observationCount: 9, diseaseRisks: [] },
      { id: 'zone-1-f', name: 'Zone A6 — Radar S1 bajo', area: 40, ndviAverage: 0.48, ndmiAverage: 0.30, temperatureAverage: 30.0, soilMoistureAverage: 55, observationCount: 7, diseaseRisks: ['Soil Moisture Anomaly'] },
    ],
  },
  {
    id: 'field-2',
    name: 'East Field',
    locationLabel: 'Valley Region',
    center: { lat: -35.1, lng: -62.25 },
    area: 200,
    crop: 'corn',
    plantedDate: new Date('2024-08-20'),
    daysFromPlanting: 70,
    overallHealth: 'excellent',
    notifications: 1,
    riskScore: 22,
    zones: [
      { id: 'zone-2-a', name: 'Zone B1', area: 100, ndviAverage: 0.72, ndmiAverage: 0.52, temperatureAverage: 28.5, soilMoistureAverage: 75, observationCount: 15, diseaseRisks: [] },
      { id: 'zone-2-b', name: 'Zone B2', area: 100, ndviAverage: 0.65, ndmiAverage: 0.44, temperatureAverage: 29.1, soilMoistureAverage: 72, observationCount: 14, diseaseRisks: ['Gray Leaf Spot'] },
    ],
  },
  {
    id: 'field-3',
    name: 'West Plot',
    locationLabel: 'Plateau Region',
    center: { lat: -34.85, lng: -62.4 },
    area: 120,
    crop: 'wheat',
    plantedDate: new Date('2024-03-10'),
    daysFromPlanting: 140,
    overallHealth: 'warning',
    notifications: 3,
    riskScore: 62,
    zones: [
      { id: 'zone-3-a', name: 'Zone C1', area: 120, ndviAverage: 0.52, ndmiAverage: 0.35, temperatureAverage: 22.8, soilMoistureAverage: 65, observationCount: 18, diseaseRisks: ['Septoria Tritici', 'Stripe Rust'] },
    ],
  },
  {
    id: 'field-4',
    name: 'South Section',
    locationLabel: 'Lowlands',
    center: { lat: -35.2, lng: -62.35 },
    area: 180,
    crop: 'cotton',
    plantedDate: new Date('2024-10-01'),
    daysFromPlanting: 30,
    overallHealth: 'good',
    notifications: 1,
    riskScore: 45,
    zones: [
      { id: 'zone-4-a', name: 'Zone D1', area: 90, ndviAverage: 0.42, ndmiAverage: 0.28, temperatureAverage: 31.2, soilMoistureAverage: 68, observationCount: 8, diseaseRisks: [] },
      { id: 'zone-4-b', name: 'Zone D2', area: 90, ndviAverage: 0.38, ndmiAverage: 0.24, temperatureAverage: 32.1, soilMoistureAverage: 62, observationCount: 7, diseaseRisks: ['Bacterial Blight Risk'] },
    ],
  },
  {
    id: 'field-5',
    name: 'North 2',
    locationLabel: 'Pampas North',
    center: { lat: -34.8, lng: -62.28 },
    area: 160,
    crop: 'sunflower',
    plantedDate: new Date('2024-08-05'),
    daysFromPlanting: 85,
    overallHealth: 'excellent',
    notifications: 0,
    riskScore: 18,
    zones: [
      { id: 'zone-5-a', name: 'Zone E1', area: 160, ndviAverage: 0.68, ndmiAverage: 0.48, temperatureAverage: 27.4, soilMoistureAverage: 70, observationCount: 13, diseaseRisks: [] },
    ],
  },
  {
    id: 'field-6',
    name: 'Canola North',
    locationLabel: 'Northern Plains',
    center: { lat: -34.75, lng: -62.32 },
    area: 140,
    crop: 'canola',
    plantedDate: new Date('2024-02-15'),
    daysFromPlanting: 145,
    overallHealth: 'warning',
    notifications: 2,
    riskScore: 58,
    zones: [
      { id: 'zone-6-a', name: 'Zone F1', area: 70, ndviAverage: 0.58, ndmiAverage: 0.4, temperatureAverage: 20.5, soilMoistureAverage: 72, observationCount: 16, diseaseRisks: ['Blackleg Risk'] },
      { id: 'zone-6-b', name: 'Zone F2', area: 70, ndviAverage: 0.55, ndmiAverage: 0.38, temperatureAverage: 21.2, soilMoistureAverage: 68, observationCount: 14, diseaseRisks: ['Sclerotinia'] },
    ],
  },
];

export const MOCK_FIELDS: Field[] = RAW_FIELDS.map(buildField);

/** @deprecated Use MOCK_FIELDS */
export const MOCK_MULTI_FIELDS = MOCK_FIELDS;

export type FieldData = Field;
/** @deprecated Use FieldZone from @/lib/types/field */
export type { FieldZone };

export function getFieldById(fieldId: string): Field | undefined {
  return MOCK_FIELDS.find((f) => f.id === fieldId);
}

export function getZoneById(zoneId: string): FieldZone | undefined {
  for (const field of MOCK_FIELDS) {
    const zone = field.zones.find((z) => z.id === zoneId);
    if (zone) return zone;
  }
  return undefined;
}

export function getFieldZones(fieldId: string): FieldZone[] {
  return getFieldById(fieldId)?.zones ?? [];
}

export function getFieldsByStatus(status: Field['overallHealth']): Field[] {
  return MOCK_FIELDS.filter((f) => f.overallHealth === status);
}

export function getFieldsByCrop(crop: CropType): Field[] {
  return MOCK_FIELDS.filter((f) => f.crop === crop);
}

export function getHighRiskFields(): Field[] {
  return MOCK_FIELDS.filter((f) => f.riskScore > 50).sort(
    (a, b) => b.riskScore - a.riskScore
  );
}

export function getTotalArea(): number {
  return MOCK_FIELDS.reduce((sum, f) => sum + f.area, 0);
}

export function getAverageHealth(): number {
  const healthScore = { excellent: 4, good: 3, warning: 2, critical: 1 };
  const totalScore = MOCK_FIELDS.reduce(
    (sum, f) => sum + healthScore[f.overallHealth],
    0
  );
  return (totalScore / MOCK_FIELDS.length) * 25;
}

export function getAverageRiskScore(): number {
  const totalRisk = MOCK_FIELDS.reduce((sum, f) => sum + f.riskScore, 0);
  return totalRisk / MOCK_FIELDS.length;
}

export function getDaysToMaturityForField(field: Field): number {
  const profile = CROP_PROFILES[field.crop];
  return Math.max(0, profile.cycleLength - field.daysFromPlanting);
}

export function getFieldNameMap(): Record<string, string> {
  return Object.fromEntries(MOCK_FIELDS.map((f) => [f.id, f.name]));
}
