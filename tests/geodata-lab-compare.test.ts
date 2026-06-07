import { describe, it, expect } from 'vitest';
import { getDemoTourLinks } from '@/lib/integrations/geodata/demo-scenarios';

describe('geodata lab compare tour', () => {
  it('maps crop to cooperative and smallholder field ids', () => {
    const soybean = getDemoTourLinks('soybean');
    expect(soybean.cooperative).toContain('field-sj-norte');
    expect(soybean.smallholder).toContain('field-pf-soja');
    expect(soybean.cooperative).toContain('tab=lab');
    expect(soybean.smallholder).toContain('tab=lab');
  });

  it('uses crop-specific SJ/PF fields for corn and wheat', () => {
    const corn = getDemoTourLinks('corn');
    expect(corn.cooperative).toContain('field-sj-este');
    expect(corn.smallholder).toContain('field-pf-maiz');

    const wheat = getDemoTourLinks('wheat');
    expect(wheat.cooperative).toContain('field-sj-oeste');
    expect(wheat.smallholder).toContain('field-pf-trigo');
  });
});
