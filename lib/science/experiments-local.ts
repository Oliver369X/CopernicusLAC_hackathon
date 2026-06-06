import type { MultisensorAnalysis, ScienceExperimentRecord } from '@/lib/science/types';

export const STORAGE_KEY = 'doctor-soya-experiments-v1';
export const MAX_LOCAL = 50;

export interface LocalExperiment {
  id: string;
  crop: string;
  field_id: string;
  zone_id: string;
  hypothesis: string;
  created_at: string;
  result?: MultisensorAnalysis;
}

function canUseStorage(): boolean {
  return typeof globalThis.localStorage !== 'undefined';
}

function readAll(): LocalExperiment[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalExperiment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: LocalExperiment[]): void {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function saveLocalExperiment(
  record: ScienceExperimentRecord & { id?: string }
): string {
  const id = record.id ?? crypto.randomUUID();
  const entry: LocalExperiment = {
    id,
    crop: record.crop,
    field_id: record.fieldId,
    zone_id: record.zoneId,
    hypothesis: record.hypothesis,
    created_at: new Date().toISOString(),
    result: record.result,
  };

  const items = readAll();
  items.unshift(entry);
  while (items.length > MAX_LOCAL) {
    items.pop();
  }
  writeAll(items);
  return id;
}

export function listLocalExperiments(filters: {
  crop?: string;
  fieldId?: string;
}): LocalExperiment[] {
  return readAll().filter((e) => {
    if (filters.crop && e.crop !== filters.crop) return false;
    if (filters.fieldId && e.field_id !== filters.fieldId) return false;
    return true;
  });
}

export interface ExperimentRow {
  id: string;
  crop: string;
  field_id: string;
  zone_id?: string;
  hypothesis: string;
  created_at: string;
  result?: {
    fusionScore?: number;
    fusionScoreMl?: number;
    healthLabel?: string;
    optical?: { ndre?: number | null };
  };
}

export function mergeExperiments(
  remote: ExperimentRow[],
  local: LocalExperiment[]
): ExperimentRow[] {
  const seen = new Set(remote.map((r) => r.id));
  const merged: ExperimentRow[] = [...remote];
  for (const loc of local) {
    if (!seen.has(loc.id)) {
      merged.push({
        id: loc.id,
        crop: loc.crop,
        field_id: loc.field_id,
        zone_id: loc.zone_id,
        hypothesis: loc.hypothesis,
        created_at: loc.created_at,
        result: loc.result
          ? {
              fusionScore: loc.result.fusionScore,
              fusionScoreMl: loc.result.fusionScoreMl ?? undefined,
              healthLabel: loc.result.healthLabel,
              optical: { ndre: loc.result.optical.ndre ?? null },
            }
          : undefined,
      });
    }
  }
  return merged.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
