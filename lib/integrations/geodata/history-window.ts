/** Ventana histórica por campo — demo 3 años vs default 1 año. */

export const FIELD_HISTORY_DAYS: Record<string, number> = {
  'field-lucia-soja': 1095,
  'field-rosa-soja': 1095,
};

export const FIELD_HISTORY_START: Record<string, string> = {
  'field-lucia-soja': '2023-01-01',
  'field-rosa-soja': '2023-01-01',
};

export const FIELD_HISTORY_END: Record<string, string> = {
  'field-lucia-soja': '2025-12-31',
  'field-rosa-soja': '2025-12-31',
};

export const GEODATA_PUBLICATION_ID = 'personas-demo-3y';

export function getHistoryDaysForField(fieldId: string): number {
  return FIELD_HISTORY_DAYS[fieldId] ?? 365;
}

export function getHistoryStartForField(fieldId: string): string | undefined {
  return FIELD_HISTORY_START[fieldId];
}

export function hasThreeYearHistory(fieldId: string): boolean {
  return fieldId in FIELD_HISTORY_DAYS;
}

export function historyWindowLabel(fieldId: string): string | undefined {
  if (!hasThreeYearHistory(fieldId)) return undefined;
  return '2023 — 2025 (3 años)';
}
