import type { DbClient } from '@/lib/db/adapter';
import type { GroundTruthRow, ImportResult } from './types';
import { validateGroundTruthRows } from './validate-rows';
import { joinGroundTruthWithTimeseries } from './join-timeseries';
import { runValidationStudy } from '../validation/run-study';

export async function importGroundTruthRows(
  service: DbClient,
  rows: GroundTruthRow[],
  options?: { autoValidate?: boolean; minValidateCount?: number }
): Promise<ImportResult> {
  const { valid, errors } = validateGroundTruthRows(rows);
  if (!valid.length) {
    return { ok: false, imported: 0, skipped: rows.length, errors, joinedTimeseries: 0 };
  }

  const { joined, matchCount } = await joinGroundTruthWithTimeseries(service, valid);

  let imported = 0;
  for (const row of joined) {
    const { error } = await service.from('science_validation_labels').insert({
      observation_id: row.observationId ?? null,
      field_id: row.fieldId || null,
      zone_id: row.zoneId ?? null,
      crop: row.crop,
      disease_label: row.diseaseLabel ?? null,
      severity: row.severity ?? 'none',
      health_label: row.healthLabel ?? null,
      lat: row.lat ?? null,
      lng: row.lng ?? null,
      notes: row.notes ?? null,
    });
    if (!error) imported++;
  }

  const minCount = options?.minValidateCount ?? 5;
  let validationRunId: string | undefined;

  if (options?.autoValidate !== false && imported >= minCount && valid[0]) {
    try {
      const run = await runValidationStudy(service, valid[0].crop);
      validationRunId = run.runId;
    } catch {
      // validation optional on import
    }
  }

  return {
    ok: imported > 0,
    imported,
    skipped: rows.length - imported,
    errors,
    joinedTimeseries: matchCount,
    validationRunId,
  };
}
