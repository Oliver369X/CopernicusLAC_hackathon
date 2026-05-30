import type { VisionAnalysis } from '@/lib/mock-data/vision-analyzer';
import type { ZoneHistoryPoint, ZoneSatelliteSnapshot } from '@/lib/data/zone-satellite-metrics';

export type StressPattern = 'sudden' | 'gradual' | 'stable' | 'unknown';

export interface SatelliteContext {
  ndvi: number;
  ndmi: number;
  ndre: number | null;
  temperature: number;
  soilMoisture: number;
  s1MoistureIndex: number | null;
  s3Lst: number | null;
  source: string;
  stressPattern: StressPattern;
  ndviDelta7d: number | null;
}

export function detectStressPattern(history: ZoneHistoryPoint[]): {
  pattern: StressPattern;
  ndviDelta7d: number | null;
} {
  if (history.length < 2) {
    return { pattern: 'unknown', ndviDelta7d: null };
  }

  const sorted = [...history].sort(
    (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
  );
  const latest = sorted[sorted.length - 1];
  const weekAgo = sorted.find(
    (p) =>
      new Date(latest.captured_at).getTime() - new Date(p.captured_at).getTime() >=
      6 * 24 * 60 * 60 * 1000
  ) ?? sorted[0];

  const delta = latest.ndvi - weekAgo.ndvi;
  if (delta <= -0.08) return { pattern: 'sudden', ndviDelta7d: delta };
  if (delta <= -0.03) return { pattern: 'gradual', ndviDelta7d: delta };
  return { pattern: 'stable', ndviDelta7d: delta };
}

export function buildSatelliteContext(
  satellite: ZoneSatelliteSnapshot | null,
  weather: { temp: number; soilMoisture: number | null } | null,
  history: ZoneHistoryPoint[],
  fallbacks: { ndvi: number; ndmi: number; temp: number; soil: number }
): SatelliteContext {
  const { pattern, ndviDelta7d } = detectStressPattern(history);

  return {
    ndvi: satellite?.ndvi ?? fallbacks.ndvi,
    ndmi: satellite?.ndmi ?? fallbacks.ndmi,
    ndre: satellite?.ndre ?? null,
    temperature: weather?.temp ?? fallbacks.temp,
    soilMoisture: weather?.soilMoisture ?? fallbacks.soil,
    s1MoistureIndex: satellite?.s1MoistureIndex ?? null,
    s3Lst: satellite?.s3Lst ?? null,
    source: satellite?.source ?? 'mock',
    stressPattern: pattern,
    ndviDelta7d,
  };
}

export function correlateVisionWithSatellite(
  vision: VisionAnalysis,
  ctx: SatelliteContext
): {
  alignment: 'consistent' | 'mixed' | 'conflicting';
  summary: string;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  let alignment: 'consistent' | 'mixed' | 'conflicting' = 'consistent';

  const visionBad = vision.overallHealth === 'critical' || vision.overallHealth === 'warning';
  const satBad = ctx.ndvi < 0.45 || (ctx.ndre != null && ctx.ndre < 0.25);

  if (visionBad && satBad) {
    recommendations.push(
      'La imagen y el satélite coinciden: hay estrés activo en la zona.'
    );
  } else if (visionBad && !satBad) {
    alignment = 'mixed';
    recommendations.push(
      'El daño visible es localizado; el promedio satelital aún no refleja caída fuerte — posible inicio de brote.'
    );
  } else if (!visionBad && satBad) {
    alignment = 'conflicting';
    recommendations.push(
      'El satélite detecta estrés antes de síntomas visibles — monitorear en 3-5 días (Red Edge / NDRE).'
    );
  }

  if (ctx.stressPattern === 'sudden') {
    recommendations.push(
      'Caída NDVI abrupta (~7 días): descartar granizo, sequía puntual o aplicación química.'
    );
  } else if (ctx.stressPattern === 'gradual') {
    recommendations.push(
      'Estrés gradual: compatible con enfermedad progresiva o deficiencia nutricional.'
    );
  }

  if (ctx.s3Lst != null && ctx.s3Lst > 35) {
    recommendations.push(`LST elevada (${ctx.s3Lst.toFixed(1)}°C): posible estrés térmico.`);
  }
  if (ctx.s1MoistureIndex != null && ctx.s1MoistureIndex < 0.3) {
    recommendations.push('Radar S1 indica suelo seco — priorizar riego si corresponde.');
  }

  const summary =
    ctx.source !== 'mock'
      ? `Datos Copernicus (${ctx.source}). NDVI ${ctx.ndvi.toFixed(2)}${
          ctx.ndre != null ? `, NDRE ${ctx.ndre.toFixed(2)}` : ''
        }. Patrón: ${ctx.stressPattern}.`
      : `Sin lectura satelital reciente; correlación con promedios de zona.`;

  return { alignment, summary, recommendations };
}
