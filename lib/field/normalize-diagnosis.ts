import type { ObservationCardData } from '@/components/field/observation-history-card';

type CardDiagnosis = NonNullable<ObservationCardData['diagnosis']>;

function normalizeSeverity(value: unknown, fallback = 'low'): string {
  if (typeof value !== 'string') return fallback;
  const key = value.toLowerCase();
  if (['low', 'medium', 'moderate', 'high', 'critical', 'warning'].includes(key)) {
    if (key === 'moderate' || key === 'warning') return 'medium';
    if (key === 'critical') return 'high';
    return key;
  }
  return fallback;
}

function normalizeProbability(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n <= 1) return Math.round(n * 100);
  return Math.round(n);
}

function fromVisionObject(v: Record<string, unknown>): CardDiagnosis | undefined {
  const detected = Array.isArray(v.detectedDiseases) ? v.detectedDiseases : [];
  const diseases = detected
    .map((d) => {
      if (!d || typeof d !== 'object') return null;
      const item = d as Record<string, unknown>;
      const name = String(item.disease ?? item.name ?? item.label ?? 'Sin clasificar');
      const probability = normalizeProbability(item.confidence ?? item.probability);
      return { name, probability };
    })
    .filter((d): d is { name: string; probability: number } => d != null);

  const confidence = normalizeProbability(v.confidence);
  const health = typeof v.overallHealth === 'string' ? v.overallHealth.toLowerCase() : '';

  if (!diseases.length) {
    if (health === 'excellent' || health === 'good') {
      return {
        diseases: [{ name: 'Healthy', probability: confidence || 85 }],
        confidence: confidence || 85,
        severity: 'low',
      };
    }
    if (health === 'warning' || health === 'critical') {
      return {
        diseases: [{ name: 'Patología detectada', probability: confidence || 70 }],
        confidence: confidence || 70,
        severity: health === 'critical' ? 'high' : 'medium',
      };
    }
    return undefined;
  }

  const top = detected[0] as Record<string, unknown> | undefined;
  const severity = normalizeSeverity(top?.severity ?? health, 'medium');

  return { diseases, confidence: confidence || diseases[0].probability, severity };
}

/** Normaliza vision_result / visionAnalysis de API, DB o IndexedDB. */
export function normalizeDiagnosis(raw: unknown): CardDiagnosis | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;

  if (o.visionAnalysis && typeof o.visionAnalysis === 'object') {
    return fromVisionObject(o.visionAnalysis as Record<string, unknown>);
  }

  if (Array.isArray(o.detectedDiseases)) {
    return fromVisionObject(o);
  }

  const rawDiseases = Array.isArray(o.diseases) ? o.diseases : [];
  const diseases = rawDiseases
    .map((d) => {
      if (!d || typeof d !== 'object') return null;
      const item = d as Record<string, unknown>;
      const name = String(item.name ?? item.disease ?? item.label ?? 'Sin clasificar');
      const probability = normalizeProbability(item.probability ?? item.confidence);
      return { name, probability };
    })
    .filter((d): d is { name: string; probability: number } => d != null);

  const confidence = normalizeProbability(o.confidence);
  const severity = normalizeSeverity(o.severity, 'low');
  if (!diseases.length) return undefined;

  return {
    diseases,
    confidence: confidence || diseases[0].probability,
    severity,
  };
}
