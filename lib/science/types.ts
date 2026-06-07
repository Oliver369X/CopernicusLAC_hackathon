/** Cultivos con módulo científico multisensor. */
export type ScienceCropId = 'soybean' | 'wheat' | 'corn' | 'coffee' | 'cacao';

export type HealthLabel = 'excellent' | 'good' | 'warning' | 'critical';

export interface OpticalBands {
  b02: number;
  b03: number;
  b04: number;
  b05: number;
  b08: number;
  b11: number;
}

export interface OpticalIndices {
  ndvi: number;
  evi: number;
  savi: number;
  ndre: number;
  ciRedEdge: number;
  ndwi: number;
  lswi: number;
  msi: number;
  redsi: number | null;
}

export interface RadarIndices {
  vv: number;
  vh: number;
  vhVvRatio: number;
  rvi: number;
  dpRvi: number;
  sarContrast?: number;
  sarHomogeneity?: number;
}

export interface TemporalSignature {
  ndviSlope7d: number | null;
  ndviSlope14d: number | null;
  dpRviSlope7d: number | null;
  ndreSlope7d: number | null;
  peakNdvi: number | null;
  peakDpRvi: number | null;
  sampleCount: number;
  phenologyPhase: string | null;
  phenologyMatch: 'aligned' | 'early' | 'late' | 'unknown';
  parcelOutlier?: boolean;
}

export interface MultisensorAnalysis {
  crop: ScienceCropId;
  fieldId: string;
  zoneId: string;
  capturedAt: string;
  optical: Partial<OpticalIndices>;
  radar: Partial<RadarIndices>;
  temporal: TemporalSignature;
  lst?: number | null;
  fusionScore: number;
  fusionScoreMl?: number | null;
  healthLabel: HealthLabel;
  healthLabelMl?: HealthLabel | null;
  mlConcordance?: boolean | null;
  anomalyFlags: string[];
  narrative: string;
  references: string[];
  source: 'database' | 'live' | 'mock';
  algorithmVersion?: string;
  productionClass?: string | null;
  provenance?: AnalysisProvenance;
}

export interface AnalysisProvenance {
  readingDate: string;
  sceneDate: string | null;
  capturedAt: string;
  dataSource: 'database' | 'live' | 'mock';
  availableDates: string[];
  liveFetchUsed: boolean;
  geodataUsed?: boolean;
  geodataParcelKey?: string;
  geodataSource?: 'parcel' | 'point' | 'region';
  geodataRegionCode?: string;
}

export interface AnalyzeOptions {
  asOfDate?: string;
  allowLiveFetch?: boolean;
}

export interface ScienceExperimentRecord {
  id?: string;
  crop: ScienceCropId;
  fieldId: string;
  zoneId: string;
  hypothesis: string;
  notes: string | null;
  result: MultisensorAnalysis;
  createdAt?: string;
}

export interface IndexWeight {
  id: keyof OpticalIndices | keyof RadarIndices | 'lst';
  weight: number;
  label: string;
  objective: string;
}

export interface CropScienceProfile {
  crop: ScienceCropId;
  displayName: string;
  scientificName: string;
  references: string[];
  primaryOptical: IndexWeight[];
  primaryRadar: IndexWeight[];
  diseaseIndices: Array<{
    disease: string;
    indices: string[];
    thresholdNotes: string;
  }>;
  phenologyStages: Array<{
    stage: string;
    daysFromPlanting: [number, number];
    expectedNdvi: [number, number];
    expectedDpRvi: [number, number] | null;
    keyIndices: string[];
  }>;
  productionClasses?: string[];
}

export interface MlFeatureVector {
  ndvi: number;
  ndre: number;
  evi: number;
  lswi: number;
  msi: number;
  dpRvi: number;
  rvi: number;
  ndviSlope7d: number;
  ndreSlope7d: number;
  daysFromPlanting: number;
  lst: number;
}
