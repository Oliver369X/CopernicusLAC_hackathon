import type { CorrelationAnalysis, VisionAnalysis } from '@/lib/mock-data/vision-analyzer';
import type { HealthLevel } from '@/lib/design/tokens';
import type { CropType } from '@/lib/mock-data/crops';
import { normalizeVisionAnalysis } from '@/lib/services/normalize-vision-analysis';

export interface SatelliteCorrelationPayload {
  alignment?: 'consistent' | 'mixed' | 'conflicting';
  summary?: string;
  recommendations?: string[];
}

export interface DiagnosticsApiPayload {
  visionAnalysis?: VisionAnalysis;
  correlation?: SatelliteCorrelationPayload;
  crop?: CropType | string;
}

const VALID_HEALTH: HealthLevel[] = ['excellent', 'good', 'warning', 'critical'];

function normalizeHealth(value: unknown): HealthLevel {
  if (typeof value === 'string') {
    const level = value.toLowerCase() as HealthLevel;
    if (VALID_HEALTH.includes(level)) return level;
  }
  return 'good';
}

/** Une visionAnalysis + correlación satelital en la vista que espera la UI de campo. */
export function buildDiagnosticsView(
  payload: DiagnosticsApiPayload
): CorrelationAnalysis | null {
  const rawVision = payload.visionAnalysis;
  if (!rawVision) return null;

  const crop =
    payload.crop === 'soy' || payload.crop === 'maize'
      ? payload.crop === 'soy'
        ? 'soybean'
        : 'corn'
      : ((payload.crop as CropType) ?? 'soybean');

  const vision = normalizeVisionAnalysis(
    { ...rawVision, timestamp: rawVision.timestamp },
    crop
  );

  const healthScore = Number.isFinite(vision.healthScore) ? vision.healthScore : 50;
  const confidence = Number.isFinite(vision.confidence) ? vision.confidence : 0;

  return {
    ...vision,
    overallHealth: normalizeHealth(vision.overallHealth),
    healthScore,
    confidence,
    detectedDiseases: Array.isArray(vision.detectedDiseases) ? vision.detectedDiseases : [],
    timestamp: vision.timestamp ? new Date(vision.timestamp) : new Date(),
    satelliteInsights: payload.correlation?.summary ? [payload.correlation.summary] : [],
    combinedRecommendations: payload.correlation?.recommendations ?? [],
    riskScore: Math.min(100, Math.max(0, 100 - healthScore)),
  };
}
