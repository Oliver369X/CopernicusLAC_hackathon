import { describe, it, expect } from 'vitest';
import {
  buildMonitorUrl,
  buildScienceUrl,
  buildStudiesUrl,
  buildInsightsUrl,
} from '@/lib/navigation/context-links';

describe('context-links', () => {
  it('builds monitor URL with field only', () => {
    expect(buildMonitorUrl({ fieldId: 'field-sj-norte' })).toBe(
      '/monitor?field=field-sj-norte'
    );
  });

  it('builds monitor URL with field zone and crop', () => {
    const url = buildMonitorUrl({
      fieldId: 'field-sj-norte',
      zoneId: 'zone-sj-n-4',
      crop: 'soybean',
    });
    expect(url).toContain('field=field-sj-norte');
    expect(url).toContain('zone=zone-sj-n-4');
    expect(url).toContain('crop=soybean');
  });

  it('builds science URL with lab tab', () => {
    const url = buildScienceUrl({
      fieldId: 'field-sj-norte',
      zoneId: 'zone-sj-n-4',
      crop: 'soybean',
      tab: 'lab',
    });
    expect(url).toBe(
      '/science/soybean?field=field-sj-norte&zone=zone-sj-n-4&tab=lab'
    );
  });

  it('builds insights URL with encoded prompt', () => {
    const url = buildInsightsUrl({
      fieldId: 'field-sj-norte',
      prompt: 'Estado NDRE',
    });
    expect(url).toContain('field=field-sj-norte');
    expect(url).toMatch(/prompt=Estado(\+|%20)NDRE/);
  });

  it('builds studies URL', () => {
    expect(
      buildStudiesUrl({
        fieldId: 'field-sj-oeste',
        zoneId: 'zone-sj-w-1',
        crop: 'wheat',
      })
    ).toBe('/science/studies?crop=wheat&field=field-sj-oeste&zone=zone-sj-w-1');
  });
});
