import type { CropScienceProfile } from '../types';

export const SOYBEAN_SCIENCE_PROFILE: CropScienceProfile = {
  crop: 'soybean',
  displayName: 'Soja',
  scientificName: 'Glycine max',
  references: [
    'EOS — NDVI vs NDRE',
    'Mandal et al. 2020 — DpRVI',
    'Doctor Soya — Asian Rust / Frogeye profiles',
  ],
  primaryOptical: [
    { id: 'ndre', weight: 0.26, label: 'NDRE', objective: 'Clorofila en dosel denso (prioridad sobre NDVI)' },
    { id: 'ciRedEdge', weight: 0.08, label: 'CIred', objective: 'Contenido clorofila' },
    { id: 'ndvi', weight: 0.08, label: 'NDVI', objective: 'Vigor referencia' },
    { id: 'lswi', weight: 0.12, label: 'LSWI', objective: 'Estrés hídrico SWIR' },
    { id: 'msi', weight: 0.10, label: 'MSI', objective: 'Agua en hoja' },
    { id: 'ndwi', weight: 0.06, label: 'NDWI', objective: 'Contenido agua vegetación' },
  ],
  primaryRadar: [
    { id: 'dpRvi', weight: 0.16, label: 'DpRVI', objective: 'Biomasa / penetración nubes LAC' },
    { id: 'rvi', weight: 0.06, label: 'RVI', objective: 'Dinámica vegetación radar' },
    { id: 'vhVvRatio', weight: 0.04, label: 'VH/VV', objective: 'Estructura dosel' },
  ],
  diseaseIndices: [
    {
      disease: 'Asian Soybean Rust',
      indices: ['ndre', 'ndvi', 'lswi'],
      thresholdNotes: 'NDRE↓ antes que NDVI visible; humedad alta aumenta riesgo.',
    },
    {
      disease: 'Frogeye Leaf Spot',
      indices: ['ndre', 'ciRedEdge'],
      thresholdNotes: 'Caída red-edge temprana en manchas circulares.',
    },
    {
      disease: 'Sudden Death Syndrome',
      indices: ['ndre', 'lswi', 'dpRvi'],
      thresholdNotes: 'Patrón hídrico + biomasa radar anómala.',
    },
  ],
  phenologyStages: [
    { stage: 'Vegetative', daysFromPlanting: [0, 50], expectedNdvi: [0.3, 0.55], expectedDpRvi: [0.08, 0.22], keyIndices: ['ndre', 'savi'] },
    { stage: 'Flowering', daysFromPlanting: [50, 80], expectedNdvi: [0.55, 0.75], expectedDpRvi: [0.18, 0.32], keyIndices: ['ndre', 'dpRvi'] },
    { stage: 'Pod Development', daysFromPlanting: [80, 110], expectedNdvi: [0.7, 0.85], expectedDpRvi: [0.22, 0.38], keyIndices: ['ndre', 'lswi'] },
    { stage: 'Maturity', daysFromPlanting: [110, 120], expectedNdvi: [0.5, 0.7], expectedDpRvi: [0.1, 0.22], keyIndices: ['ndvi', 'dpRvi'] },
  ],
};
