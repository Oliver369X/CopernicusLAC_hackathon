import type { MultisensorAnalysis } from './types';
import { formatDecimal } from '@/lib/i18n/format-number';

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
    parts.push(`NDRE ${formatDecimal(analysis.optical.ndre, 2)}`);
  }
  if (analysis.radar.dpRvi != null) {
    parts.push(`DpRVI ${formatDecimal(analysis.radar.dpRvi, 2)}`);
  }
  return parts.filter(Boolean).join(' · ');
}
