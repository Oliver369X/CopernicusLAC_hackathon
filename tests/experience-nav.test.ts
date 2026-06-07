import { describe, it, expect } from 'vitest';
import {
  COOPERATIVE_ONLY_PREFIXES,
  isCooperativeOnlyRoute,
  isSmallFarmerExperience,
} from '@/lib/navigation/experience';

describe('experience navigation', () => {
  it('allows /science for small farmers', () => {
    expect(COOPERATIVE_ONLY_PREFIXES).not.toContain('/science');
    expect(isCooperativeOnlyRoute('/science/soybean')).toBe(false);
    expect(isCooperativeOnlyRoute('/science')).toBe(false);
  });

  it('blocks analytics and insights for hectare billing', () => {
    expect(isCooperativeOnlyRoute('/analytics')).toBe(true);
    expect(isCooperativeOnlyRoute('/insights')).toBe(true);
    expect(
      isSmallFarmerExperience({ billingModel: 'hectare', planTier: 'growth', hectareLimit: 20, maxZoneSplit: 1 })
    ).toBe(true);
  });
});
