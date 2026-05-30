import type { Field } from '@/lib/types/field';

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

export function deserializeField(json: FieldJson): Field {
  return {
    ...json,
    plantedDate: new Date(json.plantedDate),
    lastUpdate: new Date(json.lastUpdate),
    zones: json.zones.map((z) => ({
      ...z,
      lastObservation: new Date(z.lastObservation),
      lastUpdate: new Date(z.lastUpdate),
    })),
  };
}

export function serializeFields(fields: Field[]): FieldJson[] {
  return fields.map(serializeField);
}

export function deserializeFields(json: FieldJson[]): Field[] {
  return json.map(deserializeField);
}
