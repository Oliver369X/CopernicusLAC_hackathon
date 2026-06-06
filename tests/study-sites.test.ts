import { describe, it, expect } from 'vitest';
import { getStudySite, STUDY_SITES } from '@/lib/science/study-sites';

describe('study-sites', () => {
  it('has 11 study sites', () => {
    expect(STUDY_SITES).toHaveLength(11);
  });

  it('returns site for stress zone', () => {
    const site = getStudySite('field-sj-norte', 'zone-sj-n-4');
    expect(site?.cohort).toBe('SJ-2025-A');
    expect(site?.groundTruthFocus).toContain('estres_hidrico');
  });
});
