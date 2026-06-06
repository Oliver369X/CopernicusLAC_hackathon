import type { ObservationCardData } from '@/components/field/observation-history-card';

const SOURCE_RANK: Record<ObservationCardData['source'], number> = {
  api: 3,
  local: 2,
  mock: 1,
};

/** Une listas sin duplicar `id` (prioridad: api > local > mock). */
export function mergeHistoryObservations(
  ...groups: ObservationCardData[][]
): ObservationCardData[] {
  const byId = new Map<string, ObservationCardData>();

  for (const group of groups) {
    for (const obs of group) {
      const prev = byId.get(obs.id);
      if (!prev) {
        byId.set(obs.id, obs);
        continue;
      }

      const keep =
        SOURCE_RANK[obs.source] >= SOURCE_RANK[prev.source] ? obs : prev;
      const other = keep === obs ? prev : obs;

      byId.set(obs.id, {
        ...keep,
        imageUrl: keep.imageUrl ?? other.imageUrl,
        diagnosis: keep.diagnosis ?? other.diagnosis,
        gps: keep.gps ?? other.gps,
        notes: keep.notes || other.notes,
      });
    }
  }

  return [...byId.values()].sort((a, b) => b.timestamp - a.timestamp);
}
