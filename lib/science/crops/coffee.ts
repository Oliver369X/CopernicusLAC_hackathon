import type { CropScienceProfile } from '../types';

export const COFFEE_SCIENCE_PROFILE: CropScienceProfile = {
  crop: 'coffee',
  displayName: 'Café',
  scientificName: 'Coffea spp.',
  references: ['Maskell et al. 2021 — S2+SAR Vietnam', 'Agroforestería LAC'],
  productionClasses: ['full_sun', 'shaded', 'young', 'uncertain'],
  primaryOptical: [
    { id: 'ndvi', weight: 0.18, label: 'NDVI', objective: 'Cobertura vegetación (insuficiente solo)' },
    { id: 'ndre', weight: 0.14, label: 'NDRE', objective: 'Clorofila / estrés' },
    { id: 'evi', weight: 0.10, label: 'EVI', objective: 'Dosel arbóreo' },
    { id: 'lswi', weight: 0.08, label: 'LSWI', objective: 'Estrés hídrico' },
  ],
  primaryRadar: [
    { id: 'dpRvi', weight: 0.14, label: 'DpRVI', objective: 'Estructura dosel' },
    { id: 'sarContrast', weight: 0.12, label: 'SAR contraste', objective: 'Textura GLCM VV/VH' },
    { id: 'sarHomogeneity', weight: 0.10, label: 'SAR homogeneidad', objective: 'Rugosidad / sombra' },
    { id: 'vhVvRatio', weight: 0.06, label: 'VH/VV', objective: 'Dispersión volumétrica' },
  ],
  diseaseIndices: [
    {
      disease: 'Confusión bosque / barbecho',
      indices: ['ndvi', 'sarContrast', 'dpRvi'],
      thresholdNotes: 'Óptico solo satura; validar con radar y campo.',
    },
  ],
  phenologyStages: [
    { stage: 'Vegetative', daysFromPlanting: [0, 365], expectedNdvi: [0.55, 0.78], expectedDpRvi: [0.12, 0.28], keyIndices: ['ndvi', 'sarContrast'] },
    { stage: 'Flowering', daysFromPlanting: [365, 450], expectedNdvi: [0.6, 0.82], expectedDpRvi: [0.15, 0.32], keyIndices: ['ndre', 'dpRvi'] },
  ],
};
