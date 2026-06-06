import { describe, expect, it } from 'vitest';
import { buildSpecialistReport } from '@/lib/diagnostics/build-specialist-report';
import { generateDiagnosticPdfBuffer } from '@/lib/reports/generate-diagnostic-pdf';
import type { CorrelationAnalysis } from '@/lib/mock-data/vision-analyzer';

const analysis: CorrelationAnalysis = {
  overallHealth: 'warning',
  healthScore: 52,
  confidence: 78,
  detectedDiseases: [
    {
      disease: 'Powdery Mildew',
      confidence: 0.95,
      severity: 'medium',
      affectedArea: 35,
      description: 'Polvo blanco visible',
      recommendations: ['Aplicar fungicida'],
    },
  ],
  leafCondition: { color: 'pale', spotting: true, wilt: false, necrosis: false },
  moistureStatus: 'adequate',
  nutritionStatus: 'good',
  timestamp: new Date(),
  satelliteInsights: ['NDVI estable'],
  combinedRecommendations: ['Monitoreo en 7 días'],
  riskScore: 48,
};

describe('generateDiagnosticPdfBuffer', () => {
  it('genera PDF sin error de react-pdf', async () => {
    const report = buildSpecialistReport(analysis, {
      fieldName: 'Lote Norte',
      zoneName: 'Zona N1',
      crop: 'soybean',
      satelliteContext: { ndvi: 0.64, ndmi: 0.47 },
    });

    const buffer = await generateDiagnosticPdfBuffer(report);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
