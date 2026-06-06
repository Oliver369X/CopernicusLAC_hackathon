import { describe, expect, it } from 'vitest';
import { normalizeVisionAnalysis } from '@/lib/services/normalize-vision-analysis';

describe('normalizeVisionAnalysis', () => {
  it('mapea severity moderate a medium', () => {
    const result = normalizeVisionAnalysis(
      {
        overallHealth: 'good',
        healthScore: 70,
        confidence: 80,
        detectedDiseases: [
          {
            disease: 'Powdery Mildew',
            confidence: 0.95,
            severity: 'moderate' as never,
            affectedArea: 0,
            description: 'Polvo blanco',
            recommendations: [],
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
      },
      'soybean'
    );

    expect(result.detectedDiseases[0].severity).toBe('medium');
    expect(result.detectedDiseases[0].affectedArea).toBeGreaterThan(0);
    expect(result.overallHealth).toBe('warning');
  });

  it('infiere hongo si hay manchas sin enfermedades listadas', () => {
    const result = normalizeVisionAnalysis(
      {
        overallHealth: 'good',
        healthScore: 75,
        confidence: 60,
        detectedDiseases: [],
        leafCondition: {
          color: 'discolored',
          spotting: true,
          wilt: false,
          necrosis: true,
        },
        moistureStatus: 'adequate',
        nutritionStatus: 'good',
      },
      'soybean'
    );

    expect(result.detectedDiseases.length).toBe(1);
    expect(result.overallHealth).toBe('warning');
  });
});
