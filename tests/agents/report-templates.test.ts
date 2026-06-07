import { describe, expect, it, vi } from 'vitest';
import type { AgentScope } from '@/lib/agents/scope';
import { listReportTemplateSummaries, resolveReportType } from '@/lib/agents/reports/templates';
import { assembleReport, prepareReportDraft } from '@/lib/agents/reports/build-report-draft';

vi.mock('@/lib/agents/reports/gather-report-data', () => ({
  DISCLAIMER: 'Disclaimer test',
  gatherReportData: vi.fn(async () => ({
    ok: true as const,
    snapshot: {
      reportId: 'AURA-RPT-TEST',
      generatedAt: '2025-06-01T12:00:00.000Z',
      orgName: 'Finca Test',
      fieldId: 'field-lucia-soja',
      fieldName: 'Chacra Lucía',
      zoneId: 'zone-lucia-soja',
      zoneName: 'Parcela',
      crop: 'soybean',
      areaHa: 10,
      ndvi: 0.62,
      ndmi: 0.41,
      health: 'good',
      diseaseRisks: ['roya asiática'],
      alerts: [{ title: 'Riesgo roya', severity: 'warning', description: 'Humidity spike' }],
      observations: [{ date: '2025-05-10', notes: 'Manchas en tercio inferior' }],
      satelliteHistoryPoints: 120,
      geodata: {
        parcelKey: 'LUCIA-SOJA-10',
        historyWindow: '3 años',
        seriesCount: 72,
        trend: 'estable',
      },
      topStressZones: [{ name: 'Parcela', ndvi: 0.62 }],
    },
  })),
}));

const scope: AgentScope = {
  orgId: 'org-lucia',
  orgName: 'Finca Lucía',
  userId: 'u1',
  userEmail: 'lucia@doctorsoya.app',
  role: 'owner',
  billingModel: 'hectare',
};

describe('report templates registry', () => {
  it('expone 5 tipos de informe', () => {
    const list = listReportTemplateSummaries();
    expect(list.length).toBe(5);
    expect(list.map((t) => t.type)).toContain('disease-situation');
  });

  it('resuelve alias en español', () => {
    expect(resolveReportType('enfermedades')).toBe('disease-situation');
    expect(resolveReportType('historial')).toBe('historical-3y');
  });
});

describe('prepareReportDraft', () => {
  it('rellena secciones auto y lista slots AI', async () => {
    const result = await prepareReportDraft(scope, 'disease-situation', 'field-lucia-soja');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.autoSections.header).toContain('Chacra Lucía');
    expect(result.draft.autoSections.metrics).toContain('NDVI');
    expect(result.draft.aiSections.map((s) => s.id)).toContain('situation-analysis');
  });
});

describe('assembleReport', () => {
  it('combina auto + contenido AI en markdown', async () => {
    const result = await assembleReport(
      scope,
      'zone-status',
      { 'status-narrative': 'La zona muestra vigor adecuado para R3.' },
      'field-lucia-soja',
      'zone-lucia-soja'
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.markdown).toContain('Informe de estado de zona');
    expect(result.report.markdown).toContain('vigor adecuado');
    expect(result.report.reportId).toBe('AURA-RPT-TEST');
  });

  it('usa fallback si falta contenido AI', async () => {
    const result = await assembleReport(scope, 'field-summary', {}, 'field-lucia-soja');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.sections['executive-summary']).toBeTruthy();
  });
});
