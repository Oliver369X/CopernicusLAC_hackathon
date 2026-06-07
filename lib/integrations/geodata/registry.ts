import type { FieldGeodataLink } from './resolve-parcel-key';
import { getStaticGeodataLink } from './resolve-parcel-key';

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

/** @deprecated Usar resolveFieldGeodataLink para lectura desde DB. */
export function getParcelKeyForField(fieldId: string): string | null {
  return getStaticGeodataLink(fieldId)?.parcelKey ?? null;
}

export function getRegionCodeForField(fieldId: string): string {
  return getStaticGeodataLink(fieldId)?.regionCode ?? 'SC-BO';
}

export type { FieldGeodataLink };
