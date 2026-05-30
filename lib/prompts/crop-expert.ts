import type { CropType } from '@/lib/mock-data/crops';
import type { SatelliteContext } from '@/lib/services/satellite-correlation';
import type { MultisensorAnalysis } from '@/lib/science/types';

const CROP_DISEASES: Record<string, string[]> = {
  soybean: [
    'Frogeye Leaf Spot',
    'Asian Soybean Rust',
    'Sudden Death Syndrome',
    'Bacterial Blight',
  ],
  corn: [
    'Northern Corn Leaf Blight',
    'Gray Leaf Spot',
    'Common Rust',
    'Fall Armyworm damage',
  ],
  wheat: ['Yellow Rust', 'Fusarium Head Blight', 'Septoria'],
};

export function buildCropExpertSystemPrompt(
  crop: CropType,
  ctx?: SatelliteContext,
  science?: MultisensorAnalysis | null
): string {
  const diseases = CROP_DISEASES[crop] ?? CROP_DISEASES.soybean;
  let satelliteBlock = '';

  if (ctx) {
    satelliteBlock = `
Contexto satélite Copernicus (usar en el diagnóstico):
- NDVI: ${ctx.ndvi.toFixed(2)}, NDMI: ${ctx.ndmi.toFixed(2)}${
      ctx.ndre != null ? `, NDRE: ${ctx.ndre.toFixed(2)}` : ''
    }
- Patrón temporal: ${ctx.stressPattern}
- Fuente: ${ctx.source}
${ctx.s3Lst != null ? `- LST Sentinel-3: ${ctx.s3Lst.toFixed(1)}°C` : ''}
${ctx.s1MoistureIndex != null ? `- Humedad radar S1: ${(ctx.s1MoistureIndex * 100).toFixed(0)}%` : ''}
`;
  }

  let scienceBlock = '';
  if (science) {
    scienceBlock = `
Análisis Science Lab (multisensor S1+S2, v${science.algorithmVersion ?? '1.0.0'}):
- Score fusión reglas: ${(science.fusionScore * 100).toFixed(0)}% (${science.healthLabel})
${science.fusionScoreMl != null ? `- Score ML baseline: ${(science.fusionScoreMl * 100).toFixed(0)}% (${science.healthLabelMl})` : ''}
- Narrativa: ${science.narrative.slice(0, 300)}
- Flags: ${science.anomalyFlags.join(', ') || 'ninguno'}
${science.radar.dpRvi != null ? `- DpRVI: ${science.radar.dpRvi.toFixed(3)}` : ''}
Cita NDRE/DpRVI cuando apoyen detección temprana antes de lesiones visibles.
`;
  }

  return `Eres un agrónomo experto en ${crop} para América Latina (Doctor Soya).
Enfermedades frecuentes: ${diseases.join(', ')}.
${satelliteBlock}${scienceBlock}
Cruza síntomas visibles con el contexto satelital. Si NDRE/NDVI cae antes de lesiones visibles, menciona detección temprana Red Edge.
Responde en JSON según el schema. Sé conservador en confianza. Incluye recomendaciones prácticas para productor rural.`;
}
