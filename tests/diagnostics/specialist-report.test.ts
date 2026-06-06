import { describe, expect, it } from 'vitest';
import { buildSpecialistReport } from '@/lib/diagnostics/build-specialist-report';
import { resolveDiseaseKnowledge } from '@/lib/diagnostics/disease-knowledge';
import type { CorrelationAnalysis } from '@/lib/mock-data/vision-analyzer';

const baseAnalysis: CorrelationAnalysis = {
  overallHealth: 'warning',
  healthScore: 52,
  confidence: 78,
  detectedDiseases: [
    {
      disease: 'Asian Soybean Rust',
      confidence: 0.82,
      severity: 'high',
      affectedArea: 18,
      description: 'Pústulas en envés foliar',
      recommendations: ['Aplicar fungicida sistémico'],
    },
  ],
  leafCondition: {
    color: 'pale',
    spotting: true,
    wilt: false,
    necrosis: false,
  },
  moistureStatus: 'adequate',
  nutritionStatus: 'good',
  timestamp: new Date(),
  satelliteInsights: ['NDVI bajo en foco norte'],
  combinedRecommendations: ['Monitoreo en 7 días'],
  riskScore: 48,
};

describe('resolveDiseaseKnowledge', () => {
  it('resuelve roya asiática por alias en inglés', () => {
    const k = resolveDiseaseKnowledge('Asian Soybean Rust', 'soybean');
    expect(k?.id).toBe('asian-soybean-rust');
    expect(k?.nameEs).toContain('Roya');
  });

  it('resuelve estrés hídrico', () => {
    const k = resolveDiseaseKnowledge('Drought Stress', 'corn');
    expect(k?.pathogenType).toBe('abiotic');
  });
});

describe('buildSpecialistReport', () => {
  it('genera informe con resumen y plan de manejo', () => {
    const report = buildSpecialistReport(baseAnalysis, {
      fieldName: 'San Julián Norte',
      zoneName: 'Zona N2',
      crop: 'soybean',
      satelliteContext: { ndvi: 0.42, ndmi: 0.31 },
    });

    expect(report.executiveSummary).toContain('San Julián Norte');
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0].knowledge?.id).toBe('asian-soybean-rust');
    expect(report.managementPlan.immediate.length).toBeGreaterThan(0);
    expect(report.satellite.interpretation).toContain('NDVI');
  });
});
