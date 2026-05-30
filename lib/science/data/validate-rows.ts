import { isScienceCrop } from '../crops/registry';
import type { GroundTruthRow, RowValidationError } from './types';

const SEVERITIES = new Set(['none', 'low', 'medium', 'high', 'critical']);
const HEALTH = new Set(['excellent', 'good', 'warning', 'critical']);

export function validateGroundTruthRows(rows: GroundTruthRow[]): {
  valid: GroundTruthRow[];
  errors: RowValidationError[];
} {
  const valid: GroundTruthRow[] = [];
  const errors: RowValidationError[] = [];

  rows.forEach((row, rowIndex) => {
    let ok = true;

    if (!isScienceCrop(row.crop)) {
      errors.push({ rowIndex, field: 'crop', message: `Invalid crop: ${row.crop}` });
      ok = false;
    }
    if (!row.fieldId && row.crop !== 'coffee' && row.crop !== 'cacao') {
      errors.push({ rowIndex, field: 'fieldId', message: 'field_id required' });
      ok = false;
    }
    if (!row.capturedAt || Number.isNaN(Date.parse(row.capturedAt))) {
      errors.push({ rowIndex, field: 'capturedAt', message: 'Invalid captured_at date' });
      ok = false;
    }
    if (row.severity && !SEVERITIES.has(row.severity)) {
      errors.push({ rowIndex, field: 'severity', message: `Invalid severity: ${row.severity}` });
      ok = false;
    }
    if (row.healthLabel && !HEALTH.has(row.healthLabel)) {
      errors.push({ rowIndex, field: 'healthLabel', message: `Invalid health_label` });
      ok = false;
    }
    if (!row.source) {
      errors.push({ rowIndex, field: 'source', message: 'source required' });
      ok = false;
    }

    if (ok) valid.push(row);
  });

  return { valid, errors };
}
