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
    zoneId: 'zone-001-a',
    fieldId: 'field-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400',
    gps: { lat: 40.2200, lng: -88.2450 },
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
    notes: 'Healthy crop development',
    photographerName: 'John Smith',
  },
  {
    id: 'obs-002',
    zoneId: 'zone-001-b',
    fieldId: 'field-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad576?w=400',
    gps: { lat: 40.2200, lng: -88.2300 },
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
    notes: 'Visible signs of rust on leaves',
    photographerName: 'Maria Garcia',
  },
  {
    id: 'obs-003',
    zoneId: 'zone-002-a',
    fieldId: 'field-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
    imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad576?w=400',
    gps: { lat: 39.9860, lng: -88.1950 },
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
    notes: 'Severe wilting due to water stress',
    photographerName: 'David Lee',
  },
  {
    id: 'obs-004',
    zoneId: 'zone-003-a',
    fieldId: 'field-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 300),
    imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400',
    gps: { lat: 40.1270, lng: -87.8900 },
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
    notes: 'Excellent crop condition',
    photographerName: 'Sarah Johnson',
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
