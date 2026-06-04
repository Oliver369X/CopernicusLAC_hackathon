import type { DbClient } from '@/lib/db/adapter';
import type { Field } from '@/lib/types/field';

const NDVI_STRESS_THRESHOLD = 0.45;
const NDVI_DROP_THRESHOLD = 0.08;

export interface SatelliteRiskPoint {
  date: string;
  riesgo: number;
  campos: number;
}

function rangeToDays(range: 'week' | 'month' | 'season'): number {
  if (range === 'week') return 7;
  if (range === 'season') return 120;
  return 30;
}

function bucketLabel(date: Date, range: 'week' | 'month' | 'season'): string {
  if (range === 'week') {
    return date.toLocaleDateString('es-AR', { weekday: 'short' });
  }
  return date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
}

/** Risk timeline from Copernicus satellite_readings (NDVI stress + drop vs 14d mean). */
export async function buildSatelliteRiskTimeline(
  service: DbClient | null,
  fields: Field[],
  range: 'week' | 'month' | 'season'
): Promise<SatelliteRiskPoint[]> {
  const zoneIds = fields.flatMap((f) => f.zones.map((z) => z.id));
  if (!service || !zoneIds.length) {
    return [];
  }

  const days = rangeToDays(range);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await service
    .from('satellite_readings')
    .select('zone_id, ndvi, reading_date, captured_at, source')
    .in('zone_id', zoneIds)
    .gte('reading_date', since.toISOString().split('T')[0])
    .order('reading_date', { ascending: true });

  const rows = (data ?? []).filter((r) => String(r.source) !== 'mock');
  if (!rows.length) return [];

  const byDate = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = String(row.reading_date ?? row.captured_at).split('T')[0];
    const list = byDate.get(key) ?? [];
    list.push(row);
    byDate.set(key, list);
  }

  const ndviHistory = new Map<string, number[]>();
  const points: SatelliteRiskPoint[] = [];

  for (const [dateKey, dayRows] of [...byDate.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    let zonesAtRisk = 0;
    let riskSum = 0;

    for (const row of dayRows) {
      const zoneId = String(row.zone_id);
      const ndvi = Number(row.ndvi);
      if (!Number.isFinite(ndvi)) continue;

      const hist = ndviHistory.get(zoneId) ?? [];
      const avg14 =
        hist.length > 0 ? hist.reduce((a, b) => a + b, 0) / hist.length : ndvi;
      const drop = avg14 - ndvi;
      const lowNdvi = ndvi < NDVI_STRESS_THRESHOLD;
      const sharpDrop = hist.length >= 2 && drop > NDVI_DROP_THRESHOLD;

      if (lowNdvi || sharpDrop) zonesAtRisk++;

      const zoneRisk = Math.min(
        100,
        Math.round(
          (lowNdvi ? 40 : 0) +
            (sharpDrop ? Math.min(50, drop * 200) : 0) +
            (1 - ndvi) * 20
        )
      );
      riskSum += zoneRisk;

      hist.push(ndvi);
      if (hist.length > 14) hist.shift();
      ndviHistory.set(zoneId, hist);
    }

    const fieldCount = new Set(dayRows.map((r) => r.zone_id)).size;
    points.push({
      date: bucketLabel(new Date(dateKey), range),
      riesgo: dayRows.length ? Math.round(riskSum / dayRows.length) : 0,
      campos: zonesAtRisk,
    });
  }

  return points.slice(-7);
}
