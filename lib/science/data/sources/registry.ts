import type { GroundTruthRow } from '../types';
import type { ScienceCropId } from '../../types';

export interface DataSourceAdapter {
  id: string;
  fetchRows(): Promise<GroundTruthRow[]>;
}

const adapters = new Map<string, DataSourceAdapter>();

export function registerDataSource(adapter: DataSourceAdapter): void {
  adapters.set(adapter.id, adapter);
}

export function getDataSource(id: string): DataSourceAdapter | undefined {
  return adapters.get(id);
}

export function listDataSources(): string[] {
  return Array.from(adapters.keys());
}

export async function syncFromSource(sourceId: string): Promise<GroundTruthRow[]> {
  const adapter = adapters.get(sourceId);
  if (!adapter) throw new Error(`Unknown data source: ${sourceId}`);
  return adapter.fetchRows();
}

export function normalizeApiCrop(raw: string): ScienceCropId | null {
  const map: Record<string, ScienceCropId> = {
    soybean: 'soybean',
    soja: 'soybean',
    soy: 'soybean',
    wheat: 'wheat',
    trigo: 'wheat',
    corn: 'corn',
    maize: 'corn',
    coffee: 'coffee',
    cacao: 'cacao',
  };
  return map[raw.trim().toLowerCase()] ?? null;
}
