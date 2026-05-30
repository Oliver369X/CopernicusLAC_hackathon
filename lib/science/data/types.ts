import type { HealthLabel, ScienceCropId } from '../types';

export type SeverityLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface GroundTruthRow {
  crop: ScienceCropId;
  fieldId: string;
  zoneId?: string;
  capturedAt: string;
  diseaseLabel?: string;
  severity?: SeverityLevel;
  healthLabel?: HealthLabel;
  lat?: number;
  lng?: number;
  observationId?: string;
  productionClass?: string;
  source: string;
  notes?: string;
  raw?: Record<string, unknown>;
}

export interface RowValidationError {
  rowIndex: number;
  field: string;
  message: string;
}

export interface ImportResult {
  ok: boolean;
  imported: number;
  skipped: number;
  errors: RowValidationError[];
  joinedTimeseries: number;
  validationRunId?: string;
}

export interface JoinedGroundTruth extends GroundTruthRow {
  timeseriesId?: string;
  optical?: Record<string, number>;
  radar?: Record<string, number>;
  fusionScoreRules?: number;
  fusionScoreMl?: number;
  healthLabelRules?: string;
  healthLabelMl?: string;
}

export const CSV_HEADERS = [
  'crop',
  'field_id',
  'zone_id',
  'captured_at',
  'disease_label',
  'severity',
  'health_label',
  'lat',
  'lng',
  'observation_id',
  'production_class',
  'source',
  'notes',
] as const;

export function csvTemplateForCrop(crop: ScienceCropId): string {
  return `${CSV_HEADERS.join(',')}\n${crop},field-1,zone-1,2026-03-15,,none,good,,,manual_csv,`;
}
