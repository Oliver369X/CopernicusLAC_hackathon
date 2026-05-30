import type { DbClient } from '@/lib/db/adapter';
import type { ScienceCropId } from '../types';
import { SCIENCE_ALGORITHM_VERSION } from '../version';
import { joinGroundTruthWithTimeseries } from '../data/join-timeseries';
import type { GroundTruthRow } from '../data/types';
import { computeValidationMetrics } from './metrics';
import { getModelVersion } from '../ml/model-registry';

interface LabelRow {
  id: string;
  field_id: string | null;
  zone_id: string | null;
  crop: string;
  disease_label: string | null;
  severity: string;
  health_label: string | null;
  created_at: string;
  observation_id: string | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
}

export interface ValidationRunResult {
  runId?: string;
  metrics: ReturnType<typeof computeValidationMetrics>;
}

export async function runValidationStudy(
  service: DbClient,
  crop: ScienceCropId
): Promise<ValidationRunResult> {
  const { data: labels } = await service
    .from('science_validation_labels')
    .select('*')
    .eq('crop', crop)
    .order('created_at', { ascending: false })
    .limit(200);

  const rows: GroundTruthRow[] = ((labels ?? []) as unknown as LabelRow[]).map((l) => ({
    crop: l.crop as ScienceCropId,
    fieldId: l.field_id ?? '',
    zoneId: l.zone_id ?? undefined,
    capturedAt: l.created_at,
    diseaseLabel: l.disease_label ?? undefined,
    severity: l.severity as GroundTruthRow['severity'],
    healthLabel: l.health_label as GroundTruthRow['healthLabel'],
    observationId: l.observation_id ?? undefined,
    lat: l.lat ?? undefined,
    lng: l.lng ?? undefined,
    source: 'db',
    notes: l.notes ?? undefined,
  }));

  const { joined } = await joinGroundTruthWithTimeseries(service, rows);
  const modelVersion = getModelVersion(crop);
  const metrics = computeValidationMetrics(
    crop,
    joined,
    SCIENCE_ALGORITHM_VERSION,
    modelVersion
  );

  const { data: inserted } = await service
    .from('science_validation_runs')
    .insert({
      crop,
      algorithm_version: SCIENCE_ALGORITHM_VERSION,
      model_version: modelVersion,
      sample_count: metrics.sampleCount,
      metrics,
    })
    .select('id')
    .single();

  return {
    runId: inserted?.id as string | undefined,
    metrics,
  };
}

export async function getLatestValidationRun(
  service: DbClient,
  crop: ScienceCropId
): Promise<{ id: string; metrics: ReturnType<typeof computeValidationMetrics>; run_at: string } | null> {
  const { data } = await service
    .from('science_validation_runs')
    .select('*')
    .eq('crop', crop)
    .order('run_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id as string,
    metrics: data.metrics as ReturnType<typeof computeValidationMetrics>,
    run_at: data.run_at as string,
  };
}
