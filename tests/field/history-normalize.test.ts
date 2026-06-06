import { describe, expect, it } from 'vitest';
import { normalizeDiagnosis } from '@/lib/field/normalize-diagnosis';
import { mergeHistoryObservations } from '@/lib/field/merge-history-observations';
import type { ObservationCardData } from '@/components/field/observation-history-card';

describe('normalizeDiagnosis', () => {
  it('normaliza vision_result anidado con visionAnalysis', () => {
    const d = normalizeDiagnosis({
      visionAnalysis: {
        overallHealth: 'warning',
        confidence: 0.95,
        detectedDiseases: [
          { disease: 'Powdery Mildew', confidence: 0.95, severity: 'moderate' },
        ],
      },
    });
    expect(d?.diseases[0].name).toBe('Powdery Mildew');
    expect(d?.severity).toBe('medium');
    expect(d?.confidence).toBe(95);
  });

  it('no rompe sin diseases', () => {
    expect(normalizeDiagnosis({ confidence: 10 })).toBeUndefined();
  });
});

describe('mergeHistoryObservations', () => {
  it('deduplica por id priorizando api', () => {
    const api: ObservationCardData[] = [
      {
        id: 'obs-1',
        timestamp: 2,
        notes: 'api',
        photographerName: 'A',
        source: 'api',
      },
    ];
    const local: ObservationCardData[] = [
      {
        id: 'obs-1',
        timestamp: 1,
        notes: 'local',
        imageUrl: 'data:image/jpeg;base64,abc',
        photographerName: 'B',
        source: 'local',
      },
    ];
    const merged = mergeHistoryObservations(api, local);
    expect(merged).toHaveLength(1);
    expect(merged[0].source).toBe('api');
    expect(merged[0].imageUrl).toBe('data:image/jpeg;base64,abc');
  });
});
