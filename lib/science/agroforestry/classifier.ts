import type { OpticalIndices, RadarIndices } from '../types';

/** Heuristic production system classifier (Maskell / Abu inspired). */
export function inferProductionClass(
  optical: Partial<OpticalIndices>,
  radar: Partial<RadarIndices>
): string {
  const ndvi = optical.ndvi ?? 0.6;
  const contrast = radar.sarContrast ?? 0.3;
  const homogeneity = radar.sarHomogeneity ?? 0.5;

  if (ndvi > 0.72 && homogeneity > 0.55 && contrast < 0.35) {
    return 'full_sun';
  }
  if (ndvi > 0.55 && contrast >= 0.35) {
    return 'shaded';
  }
  if (ndvi < 0.5 && homogeneity > 0.6) {
    return 'forest_confusion_risk';
  }
  if (ndvi < 0.45) {
    return 'young';
  }
  return 'uncertain';
}
