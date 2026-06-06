import { describe, expect, it } from 'vitest';
import { validateImportAgainstPlan } from '@/lib/billing/enforce';

const baseHectare = {
  billingModel: 'hectare' as const,
  planTier: 'free' as const,
  maxZoneSplit: 1,
  requestedZoneSplit: 1,
};

const baseCoop = {
  billingModel: 'zone' as const,
  planTier: 'cooperative' as const,
  maxZoneSplit: 8,
  requestedZoneSplit: 4,
};

describe('enforce', () => {
  it('import 3 ha en org vacía free → ok', () => {
    const r = validateImportAgainstPlan({
      ...baseHectare,
      currentTotalHa: 0,
      importTotalHa: 3,
      isDryRun: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.effectiveZoneSplit).toBe(1);
  });

  it('import 6 ha con 0 actual → ok (growth)', () => {
    const r = validateImportAgainstPlan({
      ...baseHectare,
      currentTotalHa: 0,
      importTotalHa: 6,
      isDryRun: false,
    });
    expect(r.ok).toBe(true);
  });

  it('import 10 ha con 45 actual → HECTARE_LIMIT_EXCEEDED', () => {
    const r = validateImportAgainstPlan({
      ...baseHectare,
      planTier: 'scale',
      currentTotalHa: 45,
      importTotalHa: 10,
      isDryRun: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('HECTARE_LIMIT_EXCEEDED');
  });

  it('zoneSplit=8 con max=4 → ZONE_SPLIT_NOT_ALLOWED', () => {
    const r = validateImportAgainstPlan({
      ...baseCoop,
      maxZoneSplit: 4,
      requestedZoneSplit: 8,
      currentTotalHa: 60,
      importTotalHa: 5,
      isDryRun: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('ZONE_SPLIT_NOT_ALLOWED');
  });

  it('cooperative confirm 30 ha → BELOW_COOPERATIVE_MINIMUM', () => {
    const r = validateImportAgainstPlan({
      ...baseCoop,
      currentTotalHa: 10,
      importTotalHa: 20,
      isDryRun: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('BELOW_COOPERATIVE_MINIMUM');
  });

  it('hectare model ignora zoneSplit=4 → cap a 1', () => {
    const r = validateImportAgainstPlan({
      ...baseHectare,
      requestedZoneSplit: 4,
      currentTotalHa: 0,
      importTotalHa: 2,
      isDryRun: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.effectiveZoneSplit).toBe(1);
      expect(r.warnings.length).toBeGreaterThan(0);
    }
  });
});
