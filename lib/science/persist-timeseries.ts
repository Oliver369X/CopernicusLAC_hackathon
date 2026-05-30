import type { DbClient } from '@/lib/db/adapter';
import type { MultisensorAnalysis } from './types';
import { SCIENCE_ALGORITHM_VERSION } from './version';

export async function persistScienceTimeseries(
  service: DbClient,
  fieldId: string,
  crop: string,
  analysis: MultisensorAnalysis
): Promise<void> {
  await service.from('science_timeseries').insert({
    zone_id: analysis.zoneId,
    field_id: fieldId,
    crop,
    captured_at: analysis.capturedAt,
    optical: analysis.optical,
    radar: analysis.radar,
    lst: analysis.lst ?? null,
    algorithm_version: SCIENCE_ALGORITHM_VERSION,
    fusion_score_rules: analysis.fusionScore,
    fusion_score_ml: analysis.fusionScoreMl ?? null,
    health_label_rules: analysis.healthLabel,
    health_label_ml: analysis.healthLabelMl ?? null,
    anomaly_flags: analysis.anomalyFlags,
  });
}
