import type { CropScienceProfile } from '../types';

export const CORN_SCIENCE_PROFILE: CropScienceProfile = {
  crop: 'corn',
  displayName: 'Maíz',
  scientificName: 'Zea mays',
  references: [
    'Mandal et al. 2020 — DpRVI growth',
    'Flores et al. 2025 — S1 phenology',
    'Zhao et al. 2023 — optical+SAR LAI',
  ],
  primaryOptical: [
    { id: 'ndre', weight: 0.24, label: 'NDRE', objective: 'Clorofila en dosel denso (preferir sobre NDVI)' },
    { id: 'evi', weight: 0.16, label: 'EVI', objective: 'Vigor / biomasa sin saturación NDVI' },
    { id: 'ndvi', weight: 0.10, label: 'NDVI', objective: 'Referencia vigor' },
    { id: 'lswi', weight: 0.12, label: 'LSWI', objective: 'Estrés hídrico' },
    { id: 'msi', weight: 0.10, label: 'MSI', objective: 'Agua en hoja' },
    { id: 'ndwi', weight: 0.06, label: 'NDWI', objective: 'Contenido agua vegetación' },
  ],
  primaryRadar: [
    { id: 'dpRvi', weight: 0.14, label: 'DpRVI', objective: 'Biomasa, VWC, penetración nubes' },
    { id: 'rvi', weight: 0.05, label: 'RVI', objective: 'Dinámica vegetación radar' },
    { id: 'vhVvRatio', weight: 0.03, label: 'VH/VV', objective: 'Estructura altura dosel' },
  ],
  diseaseIndices: [
    {
      disease: 'Gray Leaf Spot',
      indices: ['ndre', 'ndvi', 'lswi'],
      thresholdNotes: 'NDRE↓ con humedad alta; NDVI puede retrasarse en dosel denso.',
    },
    {
      disease: 'Northern Corn Leaf Blight',
      indices: ['ndre', 'ciRedEdge'],
      thresholdNotes: 'Red-edge sensible antes de manchas visibles.',
    },
    {
      disease: 'Southern Rust',
      indices: ['ndre', 'ndvi', 'dpRvi'],
      thresholdNotes: 'Caída red-edge + anomalía temporal DpRVI.',
    },
  ],
  phenologyStages: [
    { stage: 'Germination', daysFromPlanting: [0, 20], expectedNdvi: [0.25, 0.40], expectedDpRvi: [0.04, 0.12], keyIndices: ['savi', 'ndvi'] },
    { stage: 'Vegetative Growth', daysFromPlanting: [20, 60], expectedNdvi: [0.40, 0.65], expectedDpRvi: [0.10, 0.28], keyIndices: ['dpRvi', 'evi'] },
    { stage: 'Flowering', daysFromPlanting: [60, 85], expectedNdvi: [0.65, 0.88], expectedDpRvi: [0.25, 0.40], keyIndices: ['ndre', 'dpRvi'] },
    { stage: 'Grain Fill', daysFromPlanting: [85, 110], expectedNdvi: [0.70, 0.90], expectedDpRvi: [0.22, 0.38], keyIndices: ['ndre', 'lswi'] },
    { stage: 'Maturity', daysFromPlanting: [110, 120], expectedNdvi: [0.40, 0.60], expectedDpRvi: [0.08, 0.20], keyIndices: ['ndvi', 'dpRvi'] },
  ],
};
