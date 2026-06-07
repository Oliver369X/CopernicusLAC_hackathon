import { describe, expect, it } from 'vitest';
import { getDemoScenario } from '@/lib/integrations/geodata/demo-scenarios';
import {
  getHistoryDaysForField,
  hasThreeYearHistory,
  historyWindowLabel,
} from '@/lib/integrations/geodata/history-window';
import { getStaticGeodataLink } from '@/lib/integrations/geodata/resolve-parcel-key';

describe('personas demo 3 años', () => {
  it('Lucía 10 ha enlaza LUCIA-SOJA-10', () => {
    const link = getStaticGeodataLink('field-lucia-soja');
    expect(link?.parcelKey).toBe('LUCIA-SOJA-10');
    const scenario = getDemoScenario('field-lucia-soja');
    expect(scenario?.areaHa).toBe(10);
    expect(scenario?.persona).toBe('smallholder');
  });

  it('Rosa 500 ha enlaza ROSA-SOJA-500', () => {
    const link = getStaticGeodataLink('field-rosa-soja');
    expect(link?.parcelKey).toBe('ROSA-SOJA-500');
    const scenario = getDemoScenario('field-rosa-soja');
    expect(scenario?.areaHa).toBe(500);
    expect(scenario?.persona).toBe('cooperative');
  });

  it('ventana histórica 1095 días', () => {
    expect(hasThreeYearHistory('field-lucia-soja')).toBe(true);
    expect(getHistoryDaysForField('field-lucia-soja')).toBe(1095);
    expect(historyWindowLabel('field-rosa-soja')).toMatch(/2023/);
    expect(getHistoryDaysForField('field-sj-norte')).toBe(365);
  });
});
