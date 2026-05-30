export interface DiseaseDetection {
  disease: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedArea: number; // percentage
  description: string;
  recommendations: string[];
}

export interface VisionAnalysis {
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
  healthScore: number; // 0-100
  confidence: number; // 0-100
  detectedDiseases: DiseaseDetection[];
  leafCondition: {
    color: 'vibrant' | 'normal' | 'pale' | 'discolored';
    spotting: boolean;
    wilt: boolean;
    necrosis: boolean;
  };
  moistureStatus: 'adequate' | 'low' | 'excessive';
  nutritionStatus: 'good' | 'deficient' | 'excessive';
  timestamp: Date;
}

const COMMON_SOYBEAN_DISEASES = [
  {
    name: 'Frogeye Leaf Spot',
    confidence: 0.85,
    severity: 'medium' as const,
    description: 'Fungal infection causing circular lesions with dark borders',
    recommendations: [
      'Apply fungicide treatment',
      'Increase air circulation',
      'Monitor moisture levels',
    ],
  },
  {
    name: 'Powdery Mildew',
    confidence: 0.72,
    severity: 'low' as const,
    description: 'White powdery coating on leaves reduces photosynthesis',
    recommendations: [
      'Spray with sulfur-based fungicide',
      'Reduce humidity if possible',
      'Space plants for better airflow',
    ],
  },
  {
    name: 'Bacterial Blight',
    confidence: 0.65,
    severity: 'high' as const,
    description: 'Water-soaked lesions that spread rapidly',
    recommendations: [
      'Remove infected leaves immediately',
      'Apply copper-based bactericide',
      'Avoid watering from above',
      'Rotate crops next season',
    ],
  },
  {
    name: 'Sudden Death Syndrome',
    confidence: 0.58,
    severity: 'critical' as const,
    description: 'Soil-borne fungus causing rapid plant death',
    recommendations: [
      'No effective cure - manage prevention',
      'Improve drainage',
      'Use resistant varieties',
      'Implement long crop rotation',
    ],
  },
  {
    name: 'Septoria Leaf Spot',
    confidence: 0.71,
    severity: 'low' as const,
    description: 'Small angular lesions on leaves',
    recommendations: [
      'Monitor progress',
      'Apply fungicide if spreading',
      'Remove severely affected leaves',
    ],
  },
];

function toDiseaseDetection(
  entry: (typeof COMMON_SOYBEAN_DISEASES)[number],
  overrides: Partial<DiseaseDetection> = {}
): DiseaseDetection {
  return {
    disease: entry.name,
    description: entry.description,
    recommendations: entry.recommendations,
    severity: entry.severity,
    confidence: entry.confidence,
    affectedArea: 10,
    ...overrides,
  };
}

// Mock vision analyzer that simulates AI image analysis
export function analyzeImageMock(imageData?: string): VisionAnalysis {
  // Simulate random health conditions
  const rand = Math.random();
  let overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
  let healthScore: number;
  let detectedDiseases: DiseaseDetection[] = [];

  if (rand < 0.3) {
    // Excellent health (30% chance)
    overallHealth = 'excellent';
    healthScore = 85 + Math.random() * 15;
  } else if (rand < 0.6) {
    // Good health (30% chance)
    overallHealth = 'good';
    healthScore = 65 + Math.random() * 20;
    // Might have minor issues
    if (Math.random() > 0.7) {
      detectedDiseases.push(
        toDiseaseDetection(COMMON_SOYBEAN_DISEASES[5 % COMMON_SOYBEAN_DISEASES.length], {
          confidence: 0.4 + Math.random() * 0.3,
          affectedArea: 5 + Math.random() * 10,
        })
      );
    }
  } else if (rand < 0.85) {
    // Warning (25% chance)
    overallHealth = 'warning';
    healthScore = 40 + Math.random() * 25;
    // Multiple potential issues
    const diseaseCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < diseaseCount; i++) {
      const disease = COMMON_SOYBEAN_DISEASES[i % COMMON_SOYBEAN_DISEASES.length];
      detectedDiseases.push(
        toDiseaseDetection(disease, {
          confidence: 0.5 + Math.random() * 0.35,
          affectedArea: 15 + Math.random() * 25,
        })
      );
    }
  } else {
    // Critical (15% chance)
    overallHealth = 'critical';
    healthScore = 20 + Math.random() * 20;
    // Serious diseases detected
    const criticalDiseases = COMMON_SOYBEAN_DISEASES.filter(
      (d) => d.severity === 'critical' || d.severity === 'high'
    );
    detectedDiseases.push(
      toDiseaseDetection(criticalDiseases[0], {
        confidence: 0.75 + Math.random() * 0.2,
        affectedArea: 40 + Math.random() * 30,
      })
    );
  }

  // Simulate leaf condition based on health
  const leafColor =
    healthScore > 70
      ? 'vibrant'
      : healthScore > 50
        ? 'normal'
        : healthScore > 30
          ? 'pale'
          : 'discolored';

  return {
    overallHealth,
    healthScore: Math.round(healthScore),
    confidence: 75 + Math.random() * 20,
    detectedDiseases,
    leafCondition: {
      color: leafColor as 'vibrant' | 'normal' | 'pale' | 'discolored',
      spotting: healthScore < 70,
      wilt: healthScore < 40,
      necrosis: healthScore < 30,
    },
    moistureStatus:
      Math.random() > 0.5 ? 'adequate' : Math.random() > 0.5 ? 'low' : 'excessive',
    nutritionStatus:
      Math.random() > 0.6 ? 'good' : Math.random() > 0.5 ? 'deficient' : 'excessive',
    timestamp: new Date(),
  };
}

// Correlate vision analysis with satellite data for comprehensive diagnosis
export interface CorrelationAnalysis extends VisionAnalysis {
  satelliteInsights: string[];
  combinedRecommendations: string[];
  riskScore: number; // 0-100, higher = more risk
}

export function correlateWithSatelliteData(
  visionAnalysis: VisionAnalysis,
  ndvi: number,
  ndmi: number,
  temperature: number,
  soilMoisture: number
): CorrelationAnalysis {
  const satelliteInsights: string[] = [];
  const combinedRecommendations: string[] = [];
  let riskScore = 50;

  // Analyze NDVI (vegetation health index)
  if (ndvi < 0.4) {
    satelliteInsights.push('Very low vegetation index - significant stress detected');
    riskScore += 20;
  } else if (ndvi < 0.5) {
    satelliteInsights.push('Low vegetation index - crop health concerns');
    riskScore += 10;
  } else if (ndvi > 0.8) {
    satelliteInsights.push('Excellent vegetation coverage');
    riskScore -= 10;
  }

  // Analyze NDMI (moisture index)
  if (ndmi < 0.3) {
    satelliteInsights.push('Low soil moisture detected from satellite data');
    if (visionAnalysis.moistureStatus !== 'excessive') {
      combinedRecommendations.push('Increase irrigation frequency');
    }
    riskScore += 15;
  } else if (ndmi > 0.6) {
    satelliteInsights.push('High moisture levels detected');
    if (visionAnalysis.detectedDiseases.some((d) => d.disease.includes('Mildew'))) {
      combinedRecommendations.push('Reduce irrigation to decrease fungal pressure');
    }
    riskScore += 5;
  }

  // Analyze temperature
  if (temperature > 32) {
    satelliteInsights.push('High temperature stress - above optimal range');
    riskScore += 10;
  } else if (temperature < 15) {
    satelliteInsights.push('Low temperature - growth may be slowed');
    riskScore += 5;
  }

  // Combine vision and satellite insights
  if (
    visionAnalysis.overallHealth === 'critical' ||
    visionAnalysis.overallHealth === 'warning'
  ) {
    if (ndvi < 0.5) {
      combinedRecommendations.push(
        'Critical: Implement emergency management plan'
      );
      riskScore += 25;
    }
  }

  // Add disease-specific recommendations
  visionAnalysis.detectedDiseases.forEach((disease) => {
    disease.recommendations.forEach((rec) => {
      if (!combinedRecommendations.includes(rec)) {
        combinedRecommendations.push(rec);
      }
    });
  });

  // Add generic health recommendations
  if (visionAnalysis.nutritionStatus === 'deficient') {
    combinedRecommendations.push('Consider nutrient supplementation');
  }

  // Ensure riskScore is bounded
  riskScore = Math.max(0, Math.min(100, riskScore));

  return {
    ...visionAnalysis,
    satelliteInsights,
    combinedRecommendations,
    riskScore,
  };
}
