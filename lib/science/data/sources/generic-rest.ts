import type { GroundTruthRow } from '../types';
import { normalizeApiCrop, registerDataSource, type DataSourceAdapter } from './registry';

export interface ApiMappingConfig {
  itemsPath?: string;
  crop: string;
  fieldId: string;
  zoneId?: string;
  capturedAt: string;
  diseaseLabel?: string;
  severity?: string;
  healthLabel?: string;
  lat?: string;
  lng?: string;
  observationId?: string;
  productionClass?: string;
  notes?: string;
}

function getByPath(obj: unknown, dotPath: string): unknown {
  if (!dotPath) return obj;
  const parts = dotPath.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function str(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s || undefined;
}

export function parseMappingConfig(raw: string | undefined): ApiMappingConfig {
  const defaults: ApiMappingConfig = {
    itemsPath: 'data',
    crop: 'crop',
    fieldId: 'field_id',
    capturedAt: 'captured_at',
    diseaseLabel: 'disease_label',
    severity: 'severity',
    healthLabel: 'health_label',
  };
  if (!raw) return defaults;
  try {
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function mapApiItems(items: unknown[], mapping: ApiMappingConfig): GroundTruthRow[] {
  const rows: GroundTruthRow[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const cropRaw = str(rec[mapping.crop]);
    const crop = cropRaw ? normalizeApiCrop(cropRaw) : null;
    if (!crop) continue;

    const captured = str(rec[mapping.capturedAt]);
    if (!captured) continue;

    rows.push({
      crop,
      fieldId: str(rec[mapping.fieldId]) ?? '',
      zoneId: mapping.zoneId ? str(rec[mapping.zoneId]) : undefined,
      capturedAt: captured.includes('T') ? captured : `${captured}T12:00:00.000Z`,
      diseaseLabel: mapping.diseaseLabel ? str(rec[mapping.diseaseLabel]) : undefined,
      severity: mapping.severity
        ? (str(rec[mapping.severity]) as GroundTruthRow['severity'])
        : undefined,
      healthLabel: mapping.healthLabel
        ? (str(rec[mapping.healthLabel]) as GroundTruthRow['healthLabel'])
        : undefined,
      lat: mapping.lat && rec[mapping.lat] != null ? Number(rec[mapping.lat]) : undefined,
      lng: mapping.lng && rec[mapping.lng] != null ? Number(rec[mapping.lng]) : undefined,
      observationId: mapping.observationId ? str(rec[mapping.observationId]) : undefined,
      productionClass: mapping.productionClass ? str(rec[mapping.productionClass]) : undefined,
      notes: mapping.notes ? str(rec[mapping.notes]) : undefined,
      source: 'api:generic',
      raw: rec,
    });
  }
  return rows;
}

export class GenericRestAdapter implements DataSourceAdapter {
  id = 'generic';

  async fetchRows(): Promise<GroundTruthRow[]> {
    const url = process.env.SCIENCE_DATA_API_URL;
    const key = process.env.SCIENCE_DATA_API_KEY;
    if (!url) throw new Error('SCIENCE_DATA_API_URL not configured');

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (key) headers.Authorization = `Bearer ${key}`;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`API fetch failed: ${res.status}`);

    const json = await res.json();
    const mapping = parseMappingConfig(process.env.SCIENCE_DATA_API_MAPPING);
    const items = getByPath(json, mapping.itemsPath ?? 'data');
    if (!Array.isArray(items)) throw new Error('API response items not an array');

    return mapApiItems(items, mapping);
  }
}

export function registerGenericRestAdapter(): void {
  registerDataSource(new GenericRestAdapter());
}

registerGenericRestAdapter();
