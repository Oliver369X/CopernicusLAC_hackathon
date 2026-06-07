import { isDatabaseConfigured } from '@/lib/db/config';
import { dbQuery } from '@/lib/db/pool';

export interface FieldGeodataLink {
  parcelKey: string;
  regionCode: string;
}

const STATIC_PARCEL_KEYS: Record<string, FieldGeodataLink> = {
  'field-sj-norte': { parcelKey: 'SJ-NORTE-001', regionCode: 'SC-BO' },
  'field-sj-este': { parcelKey: 'SJ-ESTE-001', regionCode: 'SC-BO' },
  'field-sj-oeste': { parcelKey: 'SJ-OESTE-001', regionCode: 'SC-BO' },
  'field-sj-sur': { parcelKey: 'SJ-SUR-001', regionCode: 'SC-BO' },
  'field-pf-soja': { parcelKey: 'PF-SOJA-001', regionCode: 'SC-BO' },
  'field-pf-maiz': { parcelKey: 'PF-MAIZ-001', regionCode: 'SC-BO' },
  'field-pf-trigo': { parcelKey: 'PF-TRIGO-001', regionCode: 'SC-BO' },
  'field-lucia-soja': { parcelKey: 'LUCIA-SOJA-10', regionCode: 'SC-BO' },
  'field-rosa-soja': { parcelKey: 'ROSA-SOJA-500', regionCode: 'SC-BO' },
};

let cachedLinks: Map<string, FieldGeodataLink> | null = null;

async function loadLinksFromDb(): Promise<Map<string, FieldGeodataLink>> {
  if (!isDatabaseConfigured()) {
    return new Map(Object.entries(STATIC_PARCEL_KEYS));
  }
  try {
    const rows = await dbQuery<{ field_id: string; parcel_key: string; geodata_region_code: string }>(
      `SELECT field_id, parcel_key, geodata_region_code FROM field_external_ids`
    );
    const map = new Map<string, FieldGeodataLink>();
    for (const row of rows) {
      map.set(row.field_id, {
        parcelKey: row.parcel_key,
        regionCode: row.geodata_region_code ?? 'SC-BO',
      });
    }
    for (const [fieldId, link] of Object.entries(STATIC_PARCEL_KEYS)) {
      if (!map.has(fieldId)) map.set(fieldId, link);
    }
    return map;
  } catch {
    return new Map(Object.entries(STATIC_PARCEL_KEYS));
  }
}

async function getLinkMap(): Promise<Map<string, FieldGeodataLink>> {
  if (!cachedLinks) {
    cachedLinks = await loadLinksFromDb();
  }
  return cachedLinks;
}

export async function resolveFieldGeodataLink(
  fieldId: string
): Promise<FieldGeodataLink | null> {
  const map = await getLinkMap();
  return map.get(fieldId) ?? null;
}

/** Sincrona — solo mapa estático (tests y rutas sin DB). */
export function getStaticGeodataLink(fieldId: string): FieldGeodataLink | null {
  return STATIC_PARCEL_KEYS[fieldId] ?? null;
}

export function clearGeodataLinkCache(): void {
  cachedLinks = null;
}
