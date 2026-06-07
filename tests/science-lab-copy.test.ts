import { describe, it, expect } from 'vitest';
import {
  COOPERATIVE_GOALS,
  getLabGoals,
  SMALLHOLDER_GOALS,
} from '@/lib/onboarding/science-lab-copy';

describe('science-lab-copy', () => {
  it('offers plain-language goals for smallholders', () => {
    const goals = getLabGoals(true);
    expect(goals).toHaveLength(SMALLHOLDER_GOALS.length);
    expect(goals.some((g) => g.id === 'not-sure')).toBe(true);
    expect(goals.every((g) => g.hypothesis.length > 10)).toBe(true);
  });

  it('includes compare goal for both personas', () => {
    expect(SMALLHOLDER_GOALS.some((g) => g.opensCompare)).toBe(true);
    expect(COOPERATIVE_GOALS.some((g) => g.opensCompare)).toBe(true);
  });
});
