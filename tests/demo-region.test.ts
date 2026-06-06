import { describe, it, expect } from 'vitest';
import {
  isInDemoRegion,
  DEMO_FIELD_CENTERS,
} from '@/lib/geo/demo-region';

describe('demo-region', () => {
  it('accepts San Julián demo center', () => {
    expect(isInDemoRegion(-16.95, -62.85)).toBe(true);
  });

  it('rejects old Pampas coordinates', () => {
    expect(isInDemoRegion(-34.9, -62.3)).toBe(false);
  });

  it('has four field centers', () => {
    expect(DEMO_FIELD_CENTERS).toHaveLength(4);
    for (const c of DEMO_FIELD_CENTERS) {
      expect(isInDemoRegion(c.lat, c.lng)).toBe(true);
    }
  });
});
