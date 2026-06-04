import type { DbClient } from '@/lib/db/adapter';

export interface HealthTrendPoint {
  date: string;
  salud: number;
  riesgo: number;
}

export async function buildHealthTrend(
  service: DbClient,
  fieldIds: string[],
  range: 'week' | 'month' | 'season'
): Promise<HealthTrendPoint[]> {
  if (!fieldIds.length) return [];

  const days = range === 'week' ? 7 : range === 'month' ? 30 : 120;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: zones } = await service
    .from('zones')
    .select('id, field_id')
    .in('field_id', fieldIds);

  const zoneIds = (zones ?? []).map((z) => String((z as { id: string }).id));
  if (!zoneIds.length) return [];

  const { data: readings } = await service
    .from('satellite_readings')
    .select('zone_id, ndvi, captured_at')
    .in('zone_id', zoneIds)
    .gte('captured_at', since.toISOString())
    .order('captured_at', { ascending: true });

  const byDay = new Map<string, number[]>();
  for (const r of readings ?? []) {
    const row = r as { captured_at: string; ndvi: number };
    const day = new Date(row.captured_at).toISOString().slice(0, 10);
    const ndvi = Number(row.ndvi);
    if (!Number.isFinite(ndvi)) continue;
    const list = byDay.get(day) ?? [];
    list.push(ndvi);
    byDay.set(day, list);
  }

  const points: HealthTrendPoint[] = [];
  for (const [date, ndvis] of [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const avg = ndvis.reduce((s, v) => s + v, 0) / ndvis.length;
    const salud = Math.round(Math.min(100, Math.max(0, avg * 100)));
    const riesgo = Math.round(Math.max(0, Math.min(100, (0.65 - avg) * 120)));
    points.push({ date, salud, riesgo });
  }

  return points;
}
