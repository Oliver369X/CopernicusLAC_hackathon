import { describe, it, expect } from 'vitest';
import { getStudySite, STUDY_SITES } from '@/lib/science/study-sites';

describe('study-sites', () => {
  it('has 14 study sites (SJ + PF demo)', () => {
    expect(STUDY_SITES).toHaveLength(14);
  });

  it('returns PF smallholder site', () => {
    const site = getStudySite('field-pf-soja', 'zone-pf-soja');
    expect(site?.cohort).toBe('PF-2025-A');
  });

  it('returns site for stress zone', () => {
    const site = getStudySite('field-sj-norte', 'zone-sj-n-4');
    expect(site?.cohort).toBe('SJ-2025-A');
    expect(site?.groundTruthFocus).toContain('estres_hidrico');
  });
});
