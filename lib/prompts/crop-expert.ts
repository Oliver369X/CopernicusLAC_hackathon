import type { CropType } from '@/lib/mock-data/crops';
import type { SatelliteContext } from '@/lib/services/satellite-correlation';
import type { MultisensorAnalysis } from '@/lib/science/types';

const CROP_DISEASES: Record<string, string[]> = {
  soybean: [
    'Powdery Mildew',
    'Frogeye Leaf Spot',
    'Asian Soybean Rust',
    'Septoria Leaf Spot',
    'Bacterial Blight',
    'Sudden Death Syndrome',
    'Anthracnose',
    'Fungal leaf spot (unspecified)',
  ],
  corn: [
    'Gray Leaf Spot',
    'Northern Corn Leaf Blight',
    'Southern Rust',
    'Common Rust',
    'Anthracnose',
    'Fungal leaf spot (unspecified)',
  ],
  wheat: [
    'Septoria Tritici Blotch',
    'Yellow Rust (Stripe Rust)',
    'Powdery Mildew',
    'Fusarium Head Blight',
    'Fungal leaf spot (unspecified)',
  ],
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

  return `Eres un fitopatólogo senior en ${crop} para Argentina y Cono Sur (Aura Agro — Copernicus).
Enfermedades y daños a priorizar: ${diseases.join(', ')}.
${satelliteBlock}${scienceBlock}

REGLAS DE DETECCIÓN (obligatorias):
1. Si ves moho, hongo, polvo blanco, pústulas, manchas necróticas, lesiones circulares o decoloración patológica — DEBES listar al menos una entrada en detectedDiseases. Nunca devuelvas detectedDiseases vacío si hay signos visibles.
2. Estima affectedArea (%) según la fracción visible de la imagen afectada (10–80%). Si el hongo/mancha ocupa gran parte del encuadre, usa valores altos (30–70%).
3. severity: usa low | medium | high | critical según extensión y coloración. Lesiones extensas = high o critical.
4. overallHealth debe ser warning o critical cuando hay patógeno fúngico visible con confianza >= 0.7.
5. leafCondition.spotting = true si hay manchas; necrosis = true si hay tejido muerto.
6. confidence por enfermedad: 0–1 (0.85+ si el signo es claro y grande en la foto).
7. Cruza con satélite pero prioriza lo visible en la imagen de campo.

Responde solo JSON según el schema. Recomendaciones prácticas en español.`;
}
