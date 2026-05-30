import type { MultisensorAnalysis, ScienceExperimentRecord } from './types';

export function analysisToCsvRow(analysis: MultisensorAnalysis): string {
  const headers = [
    'crop',
    'fieldId',
    'zoneId',
    'capturedAt',
    'fusionScore',
    'fusionScoreMl',
    'healthLabel',
    'healthLabelMl',
    'ndvi',
    'ndre',
    'dpRvi',
    'anomalyFlags',
  ];
  const row = [
    analysis.crop,
    analysis.fieldId,
    analysis.zoneId,
    analysis.capturedAt,
    analysis.fusionScore,
    analysis.fusionScoreMl ?? '',
    analysis.healthLabel,
    analysis.healthLabelMl ?? '',
    analysis.optical.ndvi ?? '',
    analysis.optical.ndre ?? '',
    analysis.radar.dpRvi ?? '',
    analysis.anomalyFlags.join(';'),
  ];
  return `${headers.join(',')}\n${row.join(',')}`;
}

export function experimentToJson(record: ScienceExperimentRecord): string {
  return JSON.stringify(record, null, 2);
}

export function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
