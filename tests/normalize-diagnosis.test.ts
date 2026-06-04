import { describe, it, expect } from 'vitest';
import { normalizeDiagnosis } from '@/lib/field/normalize-diagnosis';

describe('normalizeDiagnosis', () => {
  it('returns undefined when diseases missing', () => {
    expect(normalizeDiagnosis({ confidence: 80 })).toBeUndefined();
  });

  it('normalizes diseases array', () => {
    const d = normalizeDiagnosis({
      diseases: [{ name: 'Roya', probability: 72 }],
      confidence: 88,
      severity: 'medium',
    });
    expect(d?.diseases[0].name).toBe('Roya');
    expect(d?.diseases[0].probability).toBe(72);
  });
});
