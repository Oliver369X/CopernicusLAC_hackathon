import type { DiseaseDetection, VisionAnalysis } from '@/lib/mock-data/vision-analyzer';
import type { CropType } from '@/lib/mock-data/crops';

type Severity = DiseaseDetection['severity'];

const SEVERITY_ALIASES: Record<string, Severity> = {
  low: 'low',
  baja: 'low',
  leve: 'low',
  medium: 'medium',
  med: 'medium',
  media: 'medium',
  moderate: 'medium',
  moderada: 'medium',
  high: 'high',
  alta: 'high',
  severa: 'high',
  severe: 'high',
  critical: 'critical',
  critica: 'critical',
  crítica: 'critical',
};

const FUNGAL_HINTS = [
  'mildew',
  'oidio',
  'oídio',
  'rust',
  'roya',
  'spot',
  'mancha',
  'blight',
  'fusarium',
  'septoria',
  'cercospora',
  'phakopsora',
  'fungal',
  'hongo',
  'moho',
];

function normalizeSeverity(value: unknown): Severity {
  if (typeof value !== 'string') return 'medium';
  const key = value.toLowerCase().trim();
  return SEVERITY_ALIASES[key] ?? 'medium';
}

function normalizeConfidence(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.5;
  if (n > 1) return Math.min(1, n / 100);
  return Math.min(1, Math.max(0, n));
}

function isFungalDisease(name: string): boolean {
  const lower = name.toLowerCase();
  return FUNGAL_HINTS.some((h) => lower.includes(h));
}

function defaultFungalForCrop(crop: CropType): DiseaseDetection {
  const byCrop: Record<CropType, Partial<DiseaseDetection>> = {
    soybean: {
      disease: 'Powdery Mildew',
      description: 'Colonias fúngicas o manchas foliares visibles en la imagen de campo.',
    },
    corn: {
      disease: 'Gray Leaf Spot',
      description: 'Lesiones foliares compatibles con patógeno fúngico en maíz.',
    },
    wheat: {
      disease: 'Septoria Tritici Blotch',
      description: 'Manchas foliares compatibles con patógeno fúngico en trigo.',
    },
    cotton: { disease: 'Fungal leaf spot', description: 'Lesión fúngica foliar visible.' },
    sunflower: { disease: 'Fungal leaf spot', description: 'Lesión fúngica foliar visible.' },
    canola: { disease: 'Fungal leaf spot', description: 'Lesión fúngica foliar visible.' },
    barley: { disease: 'Fungal leaf spot', description: 'Lesión fúngica foliar visible.' },
    rice: { disease: 'Fungal leaf spot', description: 'Lesión fúngica foliar visible.' },
  };
  const base = byCrop[crop] ?? byCrop.soybean;
  return {
    disease: base.disease ?? 'Fungal leaf lesion',
    confidence: 0.78,
    severity: 'high',
    affectedArea: 20,
    description: base.description ?? 'Patología fúngica visible en imagen.',
    recommendations: [
      'Confirmar en campo con agrónomo',
      'Registrar extensión del foco y aplicar fungicida según etiqueta',
      'Monitorear propagación en 5–7 días',
    ],
  };
}

function recalibrateHealth(analysis: VisionAnalysis): VisionAnalysis {
  const diseases = analysis.detectedDiseases;
  if (!diseases.length) return analysis;

  const ranked = [...diseases].sort(
    (a, b) => normalizeConfidence(b.confidence) - normalizeConfidence(a.confidence)
  );
  const top = ranked[0];
  const conf = normalizeConfidence(top.confidence);
  const area = Number.isFinite(top.affectedArea) ? top.affectedArea : 0;
  const fungal = isFungalDisease(top.disease);

  let overallHealth = analysis.overallHealth;
  let healthScore = analysis.healthScore;

  if (conf >= 0.9 && area >= 10 && fungal) {
    overallHealth = top.severity === 'critical' ? 'critical' : 'warning';
    healthScore = Math.min(healthScore, top.severity === 'critical' ? 25 : 45);
  } else if (conf >= 0.75 && (area >= 15 || top.severity === 'high' || top.severity === 'critical')) {
    overallHealth = top.severity === 'critical' ? 'critical' : 'warning';
    healthScore = Math.min(healthScore, top.severity === 'critical' ? 35 : 55);
  } else if (conf >= 0.6 && fungal && (analysis.leafCondition.spotting || analysis.leafCondition.necrosis)) {
    overallHealth = 'warning';
    healthScore = Math.min(healthScore, 60);
  }

  if (top.severity === 'critical' && conf >= 0.7) {
    overallHealth = 'critical';
    healthScore = Math.min(healthScore, 40);
  }

  return { ...analysis, overallHealth, healthScore };
}

/** Normaliza salida del modelo de visión: severidades, confianza y detección fúngica visible. */
export function normalizeVisionAnalysis(
  raw: Omit<VisionAnalysis, 'timestamp'> & { timestamp?: Date },
  crop: CropType = 'soybean'
): VisionAnalysis {
  const leaf = raw.leafCondition ?? {
    color: 'normal',
    spotting: false,
    wilt: false,
    necrosis: false,
  };

  let detectedDiseases: DiseaseDetection[] = Array.isArray(raw.detectedDiseases)
    ? raw.detectedDiseases.map((d) => ({
        disease: String(d.disease ?? 'Unknown'),
        confidence: normalizeConfidence(d.confidence),
        severity: normalizeSeverity(d.severity),
        affectedArea: Number.isFinite(d.affectedArea) ? Math.max(0, d.affectedArea) : 0,
        description: String(d.description ?? ''),
        recommendations: Array.isArray(d.recommendations)
          ? d.recommendations.map(String)
          : [],
      }))
    : [];

  const hasVisiblePathology =
    leaf.spotting || leaf.necrosis || leaf.wilt || leaf.color === 'discolored';

  if (detectedDiseases.length === 0 && hasVisiblePathology) {
    detectedDiseases = [defaultFungalForCrop(crop)];
  }

  if (detectedDiseases.length > 0) {
    detectedDiseases = detectedDiseases.map((d) => {
      let affectedArea = d.affectedArea;
      const conf = normalizeConfidence(d.confidence);
      if (affectedArea <= 0 && conf >= 0.7 && hasVisiblePathology) {
        affectedArea = leaf.necrosis ? 25 : 15;
      }
      if (conf >= 0.85 && isFungalDisease(d.disease) && affectedArea < 10 && hasVisiblePathology) {
        affectedArea = Math.max(affectedArea, 12);
      }
      return { ...d, affectedArea, confidence: conf };
    });
  }

  let confidence = Number(raw.confidence);
  if (!Number.isFinite(confidence)) confidence = 70;
  if (confidence <= 1) confidence *= 100;

  let healthScore = Number(raw.healthScore);
  if (!Number.isFinite(healthScore)) healthScore = 50;

  const normalized: VisionAnalysis = {
    overallHealth: raw.overallHealth ?? 'good',
    healthScore: Math.round(Math.min(100, Math.max(0, healthScore))),
    confidence: Math.round(Math.min(100, Math.max(0, confidence))),
    detectedDiseases,
    leafCondition: {
      color: (leaf.color as VisionAnalysis['leafCondition']['color']) ?? 'normal',
      spotting: Boolean(leaf.spotting),
      wilt: Boolean(leaf.wilt),
      necrosis: Boolean(leaf.necrosis),
    },
    moistureStatus: raw.moistureStatus ?? 'adequate',
    nutritionStatus: raw.nutritionStatus ?? 'good',
    timestamp: raw.timestamp ? new Date(raw.timestamp) : new Date(),
  };

  return recalibrateHealth(normalized);
}
