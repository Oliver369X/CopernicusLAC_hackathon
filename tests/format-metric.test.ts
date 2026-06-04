import { describe, it, expect } from 'vitest';
import { formatMetricDisplay } from '@/lib/i18n/format-metric';

describe('formatMetricDisplay', () => {
  it('returns live state for numeric values', () => {
    const d = formatMetricDisplay(0.64, { source: 'copernicus' });
    expect(d.state).toBe('live');
    expect(d.text).toBe('0.64');
  });

  it('returns pending with CTA for null', () => {
    const d = formatMetricDisplay(null);
    expect(d.state).toBe('pending');
    expect(d.cta?.href).toBe('/onboarding');
  });

  it('returns seed for mock source without value', () => {
    const d = formatMetricDisplay(null, { source: 'mock' });
    expect(d.state).toBe('seed');
  });
});
