import { describe, it, expect } from 'vitest';
import { generateAllAlerts } from '@/lib/alerts/generate-alerts';
import { MOCK_FIELDS } from '@/lib/mock-data/fields';

describe('generateAllAlerts', () => {
  it('generates alerts for all fields', () => {
    const alerts = generateAllAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    const fieldIds = new Set(alerts.map((a) => a.fieldId));
    expect(fieldIds.size).toBeGreaterThanOrEqual(1);
  });

  it('includes threshold alerts for low NDVI zones', () => {
    const alerts = generateAllAlerts();
    const lowNdviZone = MOCK_FIELDS.flatMap((f) => f.zones).find((z) => z.ndviAverage < 0.4);
    if (lowNdviZone) {
      const zoneAlerts = alerts.filter((a) => a.zoneId === lowNdviZone.id);
      expect(zoneAlerts.some((a) => a.type === 'threshold')).toBe(true);
    }
  });
});

describe('MOCK_FIELDS', () => {
  it('has unified field data with bounds', () => {
    expect(MOCK_FIELDS.length).toBe(4);
    for (const field of MOCK_FIELDS) {
      expect(field.bounds).toHaveLength(4);
      expect(field.zones.every((z) => z.fieldId === field.id)).toBe(true);
    }
  });
});
