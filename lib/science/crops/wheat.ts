import type { CropScienceProfile } from '../types';

export const WHEAT_SCIENCE_PROFILE: CropScienceProfile = {
  crop: 'wheat',
  displayName: 'Trigo',
  scientificName: 'Triticum aestivum',
  references: [
    'Mandal et al. 2020 — DpRVI',
    'Meroni et al. 2021 — S1/S2 phenology',
    'Mouret et al. 2020 — parcel outliers wheat',
  ],
  primaryOptical: [
    { id: 'ndre', weight: 0.22, label: 'NDRE', objective: 'Clorofila / estrés N temprano' },
    { id: 'redsi', weight: 0.18, label: 'REDSI', objective: 'Yellow rust (específico trigo)' },
    { id: 'ndvi', weight: 0.12, label: 'NDVI', objective: 'Vigor general' },
    { id: 'evi', weight: 0.08, label: 'EVI', objective: 'Biomasa en cobertura media' },
    { id: 'lswi', weight: 0.10, label: 'LSWI', objective: 'Estrés hídrico' },
    { id: 'msi', weight: 0.08, label: 'MSI', objective: 'Contenido agua hoja' },
  ],
  primaryRadar: [
    { id: 'dpRvi', weight: 0.15, label: 'DpRVI', objective: 'Crecimiento, PAI, biomasa seca' },
    { id: 'rvi', weight: 0.05, label: 'RVI', objective: 'Vegetación radar' },
    { id: 'vhVvRatio', weight: 0.02, label: 'VH/VV', objective: 'Estructura dosel' },
  ],
  diseaseIndices: [
    {
      disease: 'Stripe Rust (Yellow Rust)',
      indices: ['redsi', 'ndre', 'ndvi'],
      thresholdNotes: 'REDSI↓ + NDRE↓ antes de lesiones; confirmar en campo.',
    },
    {
      disease: 'Septoria Tritici Blotch',
      indices: ['ndvi', 'ndre', 'lswi'],
      thresholdNotes: 'Caída NDRE gradual + humedad alta.',
    },
    {
      disease: 'Powdery Mildew',
      indices: ['ndvi', 'ciRedEdge'],
      thresholdNotes: 'Clorofila↓ en red-edge con NDVI aún moderado.',
    },
  ],
  phenologyStages: [
    { stage: 'Germination', daysFromPlanting: [0, 25], expectedNdvi: [0.28, 0.45], expectedDpRvi: [0.05, 0.15], keyIndices: ['ndvi', 'savi'] },
    { stage: 'Tillering', daysFromPlanting: [25, 60], expectedNdvi: [0.45, 0.60], expectedDpRvi: [0.12, 0.25], keyIndices: ['dpRvi', 'ndvi'] },
    { stage: 'Stem Elongation', daysFromPlanting: [60, 90], expectedNdvi: [0.60, 0.75], expectedDpRvi: [0.20, 0.35], keyIndices: ['dpRvi', 'ndre'] },
    { stage: 'Heading', daysFromPlanting: [90, 110], expectedNdvi: [0.75, 0.85], expectedDpRvi: [0.28, 0.42], keyIndices: ['ndre', 'ndvi'] },
    { stage: 'Grain Fill', daysFromPlanting: [110, 135], expectedNdvi: [0.65, 0.80], expectedDpRvi: [0.22, 0.38], keyIndices: ['ndre', 'lswi'] },
    { stage: 'Maturity', daysFromPlanting: [135, 150], expectedNdvi: [0.35, 0.55], expectedDpRvi: [0.08, 0.18], keyIndices: ['ndvi', 'dpRvi'] },
  ],
};
