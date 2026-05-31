import { describe, it, expect } from 'vitest';
import { coerceNumber, formatDecimal, roundDecimal } from '@/lib/i18n/format-number';

describe('format-number', () => {
  it('coerces string numbers', () => {
    expect(coerceNumber('0.3354961960029058')).toBeCloseTo(0.3355, 4);
  });

  it('formats max 2 decimals', () => {
    expect(formatDecimal(0.3354961960029058, 2)).toBe('0.34');
    expect(formatDecimal(2371.1234, 2)).toBe('2371.12');
  });

  it('handles invalid ndre-like values', () => {
    expect(formatDecimal('n/a', 2)).toBe('—');
    expect(roundDecimal(undefined, 2)).toBeNull();
  });
});
