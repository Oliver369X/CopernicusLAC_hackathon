import type { CropScienceProfile } from '../types';

export const CACAO_SCIENCE_PROFILE: CropScienceProfile = {
  crop: 'cacao',
  displayName: 'Cacao',
  scientificName: 'Theobroma cacao',
  references: [
    'Abu et al. 2021 — CI/Ghana',
    'Moraiti et al. 2024 — Full-sun cocoa',
    'Kalischek et al. 2022 — High-res maps',
  ],
  productionClasses: ['full_sun', 'agroforestry', 'forest_confusion_risk'],
  primaryOptical: [
    { id: 'ndvi', weight: 0.20, label: 'NDVI', objective: 'Cobertura (confunde con bosque)' },
    { id: 'ndre', weight: 0.12, label: 'NDRE', objective: 'Salud fisiológica' },
    { id: 'evi', weight: 0.08, label: 'EVI', objective: 'Dosel agroforestal' },
  ],
  primaryRadar: [
    { id: 'dpRvi', weight: 0.14, label: 'DpRVI', objective: 'Estructura' },
    { id: 'sarContrast', weight: 0.14, label: 'SAR contraste', objective: 'Texturas 2do orden' },
    { id: 'sarHomogeneity', weight: 0.12, label: 'SAR homogeneidad', objective: 'Agroforestería vs bosque' },
    { id: 'rvi', weight: 0.06, label: 'RVI', objective: 'Biomasa radar' },
  ],
  diseaseIndices: [
    {
      disease: 'Confusión bosque secundario',
      indices: ['ndvi', 'sarHomogeneity', 'sarContrast'],
      thresholdNotes: 'RF multitemporal recomendado; incertidumbre alta en clasificación binaria.',
    },
  ],
  phenologyStages: [
    { stage: 'Establishment', daysFromPlanting: [0, 730], expectedNdvi: [0.5, 0.75], expectedDpRvi: [0.1, 0.25], keyIndices: ['sarContrast'] },
    { stage: 'Production', daysFromPlanting: [730, 3650], expectedNdvi: [0.58, 0.82], expectedDpRvi: [0.14, 0.32], keyIndices: ['ndvi', 'dpRvi'] },
  ],
};
