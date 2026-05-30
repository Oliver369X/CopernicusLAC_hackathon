import type { DbClient } from '@/lib/db/adapter';
import type { GroundTruthRow, JoinedGroundTruth } from './types';

const JOIN_WINDOW_MS = 3 * 86400000;

interface TimeseriesRow {
  id: string;
  zone_id: string;
  captured_at: string;
  optical: Record<string, number>;
  radar: Record<string, number>;
  fusion_score_rules: number | null;
  fusion_score_ml: number | null;
  health_label_rules: string | null;
  health_label_ml: string | null;
}

export async function joinGroundTruthWithTimeseries(
  service: DbClient,
  rows: GroundTruthRow[]
): Promise<{ joined: JoinedGroundTruth[]; matchCount: number }> {
  const joined: JoinedGroundTruth[] = [];
  let matchCount = 0;

  for (const row of rows) {
    const base: JoinedGroundTruth = { ...row };
    if (!row.zoneId) {
      joined.push(base);
      continue;
    }

    const target = new Date(row.capturedAt).getTime();
    const from = new Date(target - JOIN_WINDOW_MS).toISOString();
    const to = new Date(target + JOIN_WINDOW_MS).toISOString();

    const { data } = await service
      .from('science_timeseries')
      .select('*')
      .eq('zone_id', row.zoneId)
      .gte('captured_at', from)
      .lte('captured_at', to)
      .order('captured_at', { ascending: true })
      .limit(5);

    const hits = (data ?? []) as unknown as TimeseriesRow[];
    if (!hits.length) {
      joined.push(base);
      continue;
    }

    let best = hits[0];
    let bestDelta = Math.abs(new Date(best.captured_at).getTime() - target);
    for (const h of hits.slice(1)) {
      const d = Math.abs(new Date(h.captured_at).getTime() - target);
      if (d < bestDelta) {
        best = h;
        bestDelta = d;
      }
    }

    matchCount++;
    joined.push({
      ...base,
      timeseriesId: best.id,
      optical: best.optical,
      radar: best.radar,
      fusionScoreRules: best.fusion_score_rules ?? undefined,
      fusionScoreMl: best.fusion_score_ml ?? undefined,
      healthLabelRules: best.health_label_rules ?? undefined,
      healthLabelMl: best.health_label_ml ?? undefined,
    });
  }

  return { joined, matchCount };
}
