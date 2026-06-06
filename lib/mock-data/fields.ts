import { CROP_PROFILES, type CropType } from './crops';
import type { Field, FieldZone, GeoPoint } from '@/lib/types/field';
import {
  generateBoundsFromCenter,
  generateZoneBounds,
  inferZoneHealth,
} from '@/lib/types/field';
import { DEMO_REGION_LABEL, getDemoCenter } from '@/lib/geo/demo-region';

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

function centerFor(id: string): GeoPoint {
  const c = getDemoCenter(id);
  if (!c) throw new Error(`Missing demo center for ${id}`);
  return { lat: c.lat, lng: c.lng };
}

const RAW_FIELDS: RawFieldInput[] = [
  {
    id: 'field-sj-norte',
    name: 'Lote Norte San Julián',
    locationLabel: DEMO_REGION_LABEL,
    center: centerFor('field-sj-norte'),
    area: 150,
    crop: 'soybean',
    plantedDate: new Date('2024-09-15'),
    daysFromPlanting: 45,
    overallHealth: 'good',
    notifications: 2,
    riskScore: 35,
    zones: [
      { id: 'zone-sj-n-1', name: 'Zona N1 — Alta biomasa', area: 50, ndviAverage: 0.64, ndmiAverage: 0.47, temperatureAverage: 29.6, soilMoistureAverage: 73, observationCount: 12, diseaseRisks: [] },
      { id: 'zone-sj-n-2', name: 'Zona N2 — Riesgo roya', area: 50, ndviAverage: 0.55, ndmiAverage: 0.38, temperatureAverage: 30.2, soilMoistureAverage: 68, observationCount: 10, diseaseRisks: ['Riesgo de roya'] },
      { id: 'zone-sj-n-3', name: 'Zona N3 — Estable', area: 50, ndviAverage: 0.58, ndmiAverage: 0.42, temperatureAverage: 28.9, soilMoistureAverage: 71, observationCount: 11, diseaseRisks: [] },
      { id: 'zone-sj-n-4', name: 'Zona N4 — Estrés hídrico', area: 40, ndviAverage: 0.38, ndmiAverage: 0.22, temperatureAverage: 31.5, soilMoistureAverage: 48, observationCount: 6, diseaseRisks: ['Estrés hídrico', 'Déficit de agua'] },
      { id: 'zone-sj-n-5', name: 'Zona N5 — Recuperación', area: 40, ndviAverage: 0.62, ndmiAverage: 0.44, temperatureAverage: 28.5, soilMoistureAverage: 72, observationCount: 9, diseaseRisks: [] },
      { id: 'zone-sj-n-6', name: 'Zona N6 — Radar S1 bajo', area: 40, ndviAverage: 0.48, ndmiAverage: 0.30, temperatureAverage: 30.0, soilMoistureAverage: 55, observationCount: 7, diseaseRisks: ['Anomalía de humedad del suelo'] },
    ],
  },
  {
    id: 'field-sj-este',
    name: 'Parcela Este San Ramón',
    locationLabel: 'San Ramón, Santa Cruz — Bolivia',
    center: centerFor('field-sj-este'),
    area: 200,
    crop: 'corn',
    plantedDate: new Date('2024-08-20'),
    daysFromPlanting: 70,
    overallHealth: 'excellent',
    notifications: 1,
    riskScore: 22,
    zones: [
      { id: 'zone-sj-e-1', name: 'Zona E1 — Dosel alto', area: 100, ndviAverage: 0.72, ndmiAverage: 0.52, temperatureAverage: 28.5, soilMoistureAverage: 75, observationCount: 15, diseaseRisks: [] },
      { id: 'zone-sj-e-2', name: 'Zona E2 — Mancha foliar', area: 100, ndviAverage: 0.65, ndmiAverage: 0.44, temperatureAverage: 29.1, soilMoistureAverage: 72, observationCount: 14, diseaseRisks: ['Mancha foliar gris'] },
    ],
  },
  {
    id: 'field-sj-oeste',
    name: 'Chacra Oeste Pailón',
    locationLabel: 'Pailón, Santa Cruz — Bolivia',
    center: centerFor('field-sj-oeste'),
    area: 120,
    crop: 'wheat',
    plantedDate: new Date('2024-03-10'),
    daysFromPlanting: 140,
    overallHealth: 'warning',
    notifications: 3,
    riskScore: 62,
    zones: [
      { id: 'zone-sj-w-1', name: 'Zona W1 — Roya y septoria', area: 120, ndviAverage: 0.52, ndmiAverage: 0.35, temperatureAverage: 22.8, soilMoistureAverage: 65, observationCount: 18, diseaseRisks: ['Septoria', 'Roya amarilla'] },
    ],
  },
  {
    id: 'field-sj-sur',
    name: 'Sector Sur Tres Cruces',
    locationLabel: 'Tres Cruces, Santa Cruz — Bolivia',
    center: centerFor('field-sj-sur'),
    area: 180,
    crop: 'soybean',
    plantedDate: new Date('2024-10-01'),
    daysFromPlanting: 30,
    overallHealth: 'good',
    notifications: 1,
    riskScore: 45,
    zones: [
      { id: 'zone-sj-s-1', name: 'Zona S1 — Emergencia', area: 90, ndviAverage: 0.42, ndmiAverage: 0.28, temperatureAverage: 31.2, soilMoistureAverage: 68, observationCount: 8, diseaseRisks: [] },
      { id: 'zone-sj-s-2', name: 'Zona S2 — Riesgo bacteriano', area: 90, ndviAverage: 0.38, ndmiAverage: 0.24, temperatureAverage: 32.1, soilMoistureAverage: 62, observationCount: 7, diseaseRisks: ['Riesgo de tizón bacteriano'] },
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
