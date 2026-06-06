import type { HealthLevel } from '@/lib/design/tokens';
import type { CropType } from '@/lib/mock-data/crops';

export type PathogenType =
  | 'fungal'
  | 'bacterial'
  | 'viral'
  | 'nematode'
  | 'abiotic'
  | 'unknown';

export interface DiseaseKnowledgeEntry {
  id: string;
  aliases: string[];
  crops: CropType[];
  nameEs: string;
  scientificName: string;
  pathogenType: PathogenType;
  causalAgent: string;
  symptoms: string[];
  favorableConditions: string[];
  economicThreshold: string;
  ndviAlertBelow?: number;
  ndmiAlertBelow?: number;
  satelliteInterpretation: string;
  immediateActions: string[];
  shortTermManagement: string[];
  preventiveMeasures: string[];
  criticalPhenology?: string;
  monitoringInterval: string;
}

export interface DiseaseFindingReport {
  detectionName: string;
  nameEs: string;
  confidencePct: number;
  severityLabel: string;
  affectedAreaPct: number;
  description: string;
  knowledge: DiseaseKnowledgeEntry | null;
  specialistNarrative: string;
  recommendations: string[];
}

export interface SpecialistDiagnosticReport {
  reportId: string;
  generatedAt: string;
  orgName: string;
  fieldName: string;
  zoneName: string;
  crop: string;
  cropLabel: string;
  observationId?: string;
  coordinates?: { lat: number; lng: number };
  notes?: string;
  overallHealth: HealthLevel;
  healthScore: number;
  confidence: number;
  riskScore: number;
  executiveSummary: string;
  methodology: string[];
  visualAssessment: {
    leafColor: string;
    spotting: boolean;
    wilt: boolean;
    necrosis: boolean;
    moistureStatus: string;
    nutritionStatus: string;
  };
  satellite: {
    ndvi: number | null;
    ndmi: number | null;
    ndre: number | null;
    lst: number | null;
    s1Moisture: number | null;
    stressPattern: string | null;
    source: string | null;
    insights: string[];
    interpretation: string;
  };
  findings: DiseaseFindingReport[];
  managementPlan: {
    immediate: string[];
    shortTerm: string[];
    preventive: string[];
    monitoring: string[];
  };
  combinedRecommendations: string[];
  disclaimer: string;
}
