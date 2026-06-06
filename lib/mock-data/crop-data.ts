/**
 * Crop Observations and Diagnosis Data
 */

export interface DiagnosisResult {
  id: string;
  diseases: DiseaseDetection[];
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
  timestamp: Date;
}

export interface DiseaseDetection {
  name: string;
  probability: number; // 0-100
  affectedArea: number; // percentage
  severity: 'low' | 'medium' | 'high';
}

export interface Observation {
  id: string;
  zoneId: string;
  fieldId: string;
  timestamp: Date;
  imageUrl: string;
  gps: { lat: number; lng: number };
  diagnosis?: DiagnosisResult;
  notes: string;
  photographerName: string;
}

// Mock observations
export const MOCK_OBSERVATIONS: Observation[] = [
  {
    id: 'obs-001',
    zoneId: 'zone-sj-n-1',
    fieldId: 'field-sj-norte',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    imageUrl: 'https://picsum.photos/seed/campo-saludable/800/450',
    gps: { lat: -16.95, lng: -62.85 },
    diagnosis: {
      id: 'diag-001',
      diseases: [
        { name: 'Healthy', probability: 95, affectedArea: 0, severity: 'low' },
      ],
      confidence: 98,
      severity: 'low',
      recommendations: ['Continue normal watering', 'Monitor for pests'],
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
    },
    notes: 'Desarrollo del cultivo en buen estado',
    photographerName: 'Juan Pérez',
  },
  {
    id: 'obs-002',
    zoneId: 'zone-sj-n-2',
    fieldId: 'field-sj-norte',
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    imageUrl: 'https://picsum.photos/seed/campo-roya/800/450',
    gps: { lat: -16.94, lng: -62.84 },
    diagnosis: {
      id: 'diag-002',
      diseases: [
        { name: 'Rust', probability: 75, affectedArea: 20, severity: 'medium' },
        {
          name: 'Powdery Mildew',
          probability: 35,
          affectedArea: 5,
          severity: 'low',
        },
      ],
      confidence: 82,
      severity: 'medium',
      recommendations: [
        'Apply fungicide treatment',
        'Increase ventilation',
        'Monitor humidity levels',
      ],
      timestamp: new Date(Date.now() - 1000 * 60 * 180),
    },
    notes: 'Signos visibles de roya en las hojas',
    photographerName: 'María García',
  },
  {
    id: 'obs-003',
    zoneId: 'zone-sj-n-4',
    fieldId: 'field-sj-norte',
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
    imageUrl: 'https://picsum.photos/seed/campo-sequia/800/450',
    gps: { lat: -16.96, lng: -62.86 },
    diagnosis: {
      id: 'diag-003',
      diseases: [
        {
          name: 'Drought Stress',
          probability: 88,
          affectedArea: 45,
          severity: 'high',
        },
      ],
      confidence: 91,
      severity: 'high',
      recommendations: [
        'Increase irrigation immediately',
        'Apply stress-relief treatment',
        'Monitor soil moisture closely',
      ],
      timestamp: new Date(Date.now() - 1000 * 60 * 240),
    },
    notes: 'Marchitamiento severo por estrés hídrico',
    photographerName: 'David López',
  },
  {
    id: 'obs-004',
    zoneId: 'zone-sj-e-1',
    fieldId: 'field-sj-este',
    timestamp: new Date(Date.now() - 1000 * 60 * 300),
    imageUrl: 'https://picsum.photos/seed/campo-saludable/800/450',
    gps: { lat: -17.05, lng: -62.55 },
    diagnosis: {
      id: 'diag-004',
      diseases: [
        { name: 'Healthy', probability: 97, affectedArea: 0, severity: 'low' },
      ],
      confidence: 99,
      severity: 'low',
      recommendations: ['Maintain current practices', 'Schedule next inspection in 10 days'],
      timestamp: new Date(Date.now() - 1000 * 60 * 300),
    },
    notes: 'Excelente condición del cultivo',
    photographerName: 'Sara Jiménez',
  },
];

/**
 * Get observations for a zone
 */
export function getZoneObservations(zoneId: string): Observation[] {
  return MOCK_OBSERVATIONS.filter((o) => o.zoneId === zoneId);
}

/**
 * Get observations for a field
 */
export function getFieldObservations(fieldId: string): Observation[] {
  return MOCK_OBSERVATIONS.filter((o) => o.fieldId === fieldId);
}

/**
 * Get observation by ID
 */
export function getObservationById(id: string): Observation | undefined {
  return MOCK_OBSERVATIONS.find((o) => o.id === id);
}

/**
 * Mock AI analysis function
 * In a real app, this would call an AI vision API
 */
export function generateMockDiagnosis(
  imageUrl: string,
  ndviValue: number = 0.5
): DiagnosisResult {
  // Simulate disease detection based on image characteristics
  // In real implementation, this would use actual AI models

  const diseases: DiseaseDetection[] = [];
  let confidence = Math.random() * 20 + 75; // 75-95

  // Healthy by default
  if (Math.random() > 0.7) {
    diseases.push({
      name: 'Healthy',
      probability: confidence,
      affectedArea: 0,
      severity: 'low',
    });
  } else {
    // Simulate disease detection
    const diseaseChances = [
      { name: 'Rust', healthy: false, minNdvi: 0.3 },
      { name: 'Powdery Mildew', healthy: false, minNdvi: 0.4 },
      { name: 'Leaf Spot', healthy: false, minNdvi: 0.35 },
      { name: 'Drought Stress', healthy: false, minNdvi: 0.25 },
      { name: 'Nutrient Deficiency', healthy: false, minNdvi: 0.4 },
    ];

    for (const disease of diseaseChances) {
      if (ndviValue < 0.5 && Math.random() > 0.6) {
        const probability = Math.random() * 40 + 50;
        const severity =
          probability > 75 ? 'high' : probability > 50 ? 'medium' : 'low';

        diseases.push({
          name: disease.name,
          probability: Math.min(100, probability),
          affectedArea: Math.random() * 50,
          severity,
        });

        confidence = Math.min(confidence, probability + 10);
      }
    }

    if (diseases.length === 0) {
      diseases.push({
        name: 'Healthy',
        probability: 85 + Math.random() * 10,
        affectedArea: 0,
        severity: 'low',
      });
    }
  }

  const severity =
    diseases[0].probability > 75
      ? 'high'
      : diseases[0].probability > 50
        ? 'medium'
        : 'low';

  const recommendations =
    severity === 'high'
      ? [
          'Take immediate action',
          'Apply recommended treatment',
          'Increase monitoring frequency',
        ]
      : severity === 'medium'
        ? [
            'Monitor closely',
            'Apply preventive measures',
            'Check weather forecast',
          ]
        : ['Continue normal practices', 'Routine maintenance only'];

  return {
    id: `diag-${Date.now()}`,
    diseases,
    confidence: Math.round(confidence),
    severity,
    recommendations,
    timestamp: new Date(),
  };
}

/**
 * Get all observations sorted by recency
 */
export function getAllObservations(): Observation[] {
  return [...MOCK_OBSERVATIONS].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
}
