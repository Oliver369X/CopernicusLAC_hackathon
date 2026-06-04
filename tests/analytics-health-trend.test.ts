import { describe, it, expect } from 'vitest';
import { buildHealthTrend } from '@/lib/analytics/health-trend';

describe('buildHealthTrend', () => {
  it('returns empty array without field ids', async () => {
    const service = {
      from: () => ({
        select: () => ({ in: () => ({ data: [], error: null }) }),
      }),
    } as never;
    const points = await buildHealthTrend(service, [], 'week');
    expect(points).toEqual([]);
  });
});
