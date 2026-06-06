const PARCEL_KEYS: Record<string, string> = {
  'field-sj-norte': 'SJ-NORTE-001',
  'field-sj-este': 'SJ-ESTE-001',
  'field-sj-oeste': 'SJ-OESTE-001',
  'field-sj-sur': 'SJ-SUR-001',
};

export function isGeodataEnabled(): boolean {
  return process.env.GEODATA_ENABLED === 'true';
}

export function getGeodataBaseUrl(): string {
  return process.env.GEODATA_BASE_URL ?? 'http://localhost:8000';
}

export function getGeodataApiKey(): string | null {
  const key = process.env.GEODATA_API_KEY;
  return key?.trim() ? key.trim() : null;
}

export function getParcelKeyForField(fieldId: string): string | null {
  return PARCEL_KEYS[fieldId] ?? null;
}
