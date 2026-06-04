import type { Field, FieldZone } from '@/lib/types/field';
import { coerceMetricNumber } from '@/lib/i18n/format-number';

export type FieldJson = Omit<Field, 'plantedDate' | 'lastUpdate' | 'zones'> & {
  plantedDate: string;
  lastUpdate: string;
  zones: Array<
    Omit<Field['zones'][number], 'lastObservation' | 'lastUpdate'> & {
      lastObservation: string;
      lastUpdate: string;
    }
  >;
};

export function serializeField(field: Field): FieldJson {
  return {
    ...field,
    plantedDate: field.plantedDate.toISOString(),
    lastUpdate: field.lastUpdate.toISOString(),
    zones: field.zones.map((z) => ({
      ...z,
      lastObservation: z.lastObservation.toISOString(),
      lastUpdate: z.lastUpdate.toISOString(),
    })),
  };
}

function normalizeZoneFromJson(z: FieldJson['zones'][number]): FieldZone {
  return {
    ...z,
    area: coerceMetricNumber(z.area, 0),
    ndviAverage: coerceMetricNumber(z.ndviAverage, 0),
    ndmiAverage: coerceMetricNumber(z.ndmiAverage, 0),
    temperatureAverage: coerceMetricNumber(z.temperatureAverage, 0),
    soilMoistureAverage: coerceMetricNumber(z.soilMoistureAverage, 0),
    observationCount: Math.max(0, Math.round(coerceMetricNumber(z.observationCount, 0))),
    lastObservation: new Date(z.lastObservation),
    lastUpdate: new Date(z.lastUpdate),
  };
}

export function deserializeField(json: FieldJson): Field {
  return {
    ...json,
    center: {
      lat: coerceMetricNumber(json.center?.lat, 0),
      lng: coerceMetricNumber(json.center?.lng, 0),
    },
    area: coerceMetricNumber(json.area, 0),
    daysFromPlanting: Math.max(0, Math.round(coerceMetricNumber(json.daysFromPlanting, 0))),
    notifications: Math.max(0, Math.round(coerceMetricNumber(json.notifications, 0))),
    riskScore: coerceMetricNumber(json.riskScore, 0),
    plantedDate: new Date(json.plantedDate),
    lastUpdate: new Date(json.lastUpdate),
    zones: json.zones.map(normalizeZoneFromJson),
  };
}

export function serializeFields(fields: Field[]): FieldJson[] {
  return fields.map(serializeField);
}

export function deserializeFields(json: FieldJson[]): Field[] {
  return json.map(deserializeField);
}
