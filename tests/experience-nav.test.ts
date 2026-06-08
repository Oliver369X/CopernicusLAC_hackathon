import { describe, it, expect } from 'vitest';
import {
  COOPERATIVE_ONLY_PREFIXES,
  isCooperativeOnlyRoute,
  isSmallFarmerExperience,
  isPlainExperience,
  canAccessTechnicalMode,
  shouldBlockTechnicalRoute,
  getDefaultHomeHref,
  getNavGroupsForExperience,
} from '@/lib/navigation/experience';

describe('experience navigation', () => {
  const hectareBilling = {
    billingModel: 'hectare' as const,
    planTier: 'growth' as const,
    hectareLimit: 20,
    maxZoneSplit: 1,
  };

  const zoneBilling = {
    billingModel: 'zone' as const,
    planTier: 'cooperative' as const,
    hectareLimit: 500,
    maxZoneSplit: 8,
  };

  it('allows /science for small farmers', () => {
    expect(COOPERATIVE_ONLY_PREFIXES).not.toContain('/science');
    expect(isCooperativeOnlyRoute('/science/soybean')).toBe(false);
    expect(isCooperativeOnlyRoute('/science')).toBe(false);
  });

  it('blocks analytics and insights for hectare billing', () => {
    expect(isCooperativeOnlyRoute('/analytics')).toBe(true);
    expect(isCooperativeOnlyRoute('/insights')).toBe(true);
    expect(isSmallFarmerExperience(hectareBilling)).toBe(true);
  });

  it('plain by default for all users', () => {
    expect(isPlainExperience(hectareBilling)).toBe(true);
    expect(isPlainExperience(zoneBilling)).toBe(true);
    expect(isPlainExperience(zoneBilling, false)).toBe(true);
  });

  it('technical mode only for zone billing', () => {
    expect(canAccessTechnicalMode(hectareBilling)).toBe(false);
    expect(canAccessTechnicalMode(zoneBilling)).toBe(true);
    expect(isPlainExperience(zoneBilling, true)).toBe(false);
  });

  it('blocks technical routes in plain mode', () => {
    expect(shouldBlockTechnicalRoute('/dashboard', zoneBilling, false)).toBe(true);
    expect(shouldBlockTechnicalRoute('/analytics', zoneBilling, false)).toBe(true);
    expect(shouldBlockTechnicalRoute('/science/compare', zoneBilling, false)).toBe(true);
    expect(shouldBlockTechnicalRoute('/dashboard', zoneBilling, true)).toBe(false);
  });

  it('default home is /inicio in plain mode', () => {
    expect(getDefaultHomeHref(hectareBilling)).toBe('/inicio');
    expect(getDefaultHomeHref(zoneBilling)).toBe('/inicio');
    expect(getDefaultHomeHref(zoneBilling, true)).toBe('/dashboard');
  });

  it('plain nav uses productor labels', () => {
    const groups = getNavGroupsForExperience(zoneBilling, false);
    const labels = groups.flatMap((g) => g.items.map((i) => i.label));
    expect(labels).toContain('Inicio');
    expect(labels).toContain('Cómo va mi cultivo');
    expect(labels).not.toContain('Lab. Científico');
  });
});
