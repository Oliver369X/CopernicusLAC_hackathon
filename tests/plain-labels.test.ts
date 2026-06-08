import { describe, it, expect } from 'vitest';
import {
  labelHealthPlain,
  labelMetricPlain,
  labelAlertTypePlain,
  cropStatusSentence,
  PLAIN_METRIC_LABELS,
} from '@/lib/i18n/plain-labels';

describe('plain-labels', () => {
  it('maps metrics without siglas', () => {
    expect(labelMetricPlain('ndvi')).toBe('Verdor del cultivo');
    expect(labelMetricPlain('ndre')).toBe('Salud de la hoja');
    expect(Object.values(PLAIN_METRIC_LABELS).join(' ')).not.toMatch(/NDVI|NDRE|NDMI/);
  });

  it('maps health to productor language', () => {
    expect(labelHealthPlain('good')).toBe('Bien');
    expect(labelHealthPlain('critical')).toBe('Urgente');
    expect(labelHealthPlain('warning')).toBe('Conviene revisar');
  });

  it('maps alert types without technical terms', () => {
    expect(labelAlertTypePlain('anomaly')).toBe('Algo cambió en tu parcela');
    expect(labelAlertTypePlain('threshold')).toBe('Límite de alerta');
  });

  it('builds crop status sentence', () => {
    expect(cropStatusSentence('Soja', 'good')).toContain('bien');
    expect(cropStatusSentence('Soja', null)).toContain('esperando');
  });
});
