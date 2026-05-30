import type { MultisensorAnalysis } from './types';

/** Narrativa corta para alertas WhatsApp / push. */
export function formatScienceAlertNarrative(analysis: MultisensorAnalysis): string {
  const parts = [
    analysis.narrative.slice(0, 180),
    analysis.anomalyFlags.length
      ? `Flags: ${analysis.anomalyFlags.slice(0, 4).join(', ')}`
      : null,
  ];
  if (analysis.fusionScoreMl != null) {
    parts.push(
      `Reglas ${(analysis.fusionScore * 100).toFixed(0)}% vs ML ${(analysis.fusionScoreMl * 100).toFixed(0)}%` +
        (analysis.mlConcordance ? ' (concordantes)' : ' (revisar)')
    );
  }
  if (analysis.optical.ndre != null) {
    parts.push(`NDRE ${analysis.optical.ndre.toFixed(2)}`);
  }
  if (analysis.radar.dpRvi != null) {
    parts.push(`DpRVI ${analysis.radar.dpRvi.toFixed(2)}`);
  }
  return parts.filter(Boolean).join(' · ');
}
