export type AgentReportType =
  | 'disease-situation'
  | 'historical-3y'
  | 'food-safety'
  | 'field-summary'
  | 'zone-status';

export interface ReportTemplateSection {
  id: string;
  title: string;
  /** auto = datos del sistema; ai = el agente redacta solo el texto */
  fillMode: 'auto' | 'ai';
  promptHint: string;
  maxWords?: number;
}

export interface ReportTemplate {
  type: AgentReportType;
  title: string;
  description: string;
  sections: ReportTemplateSection[];
}

export interface ReportDataSnapshot {
  reportId: string;
  generatedAt: string;
  orgName: string;
  fieldId: string;
  fieldName: string;
  zoneId?: string;
  zoneName?: string;
  crop: string;
  areaHa: number;
  ndvi?: number;
  ndmi?: number;
  health?: string;
  diseaseRisks: string[];
  alerts: Array<{ title: string; severity: string; description?: string }>;
  observations: Array<{ date: string; notes: string }>;
  satelliteHistoryPoints: number;
  geodata?: {
    parcelKey: string;
    historyWindow?: string;
    seriesCount?: number;
    trend?: string;
  };
  topStressZones: Array<{ name: string; ndvi: number }>;
}

export interface ReportDraft {
  template: ReportTemplate;
  snapshot: ReportDataSnapshot;
  autoSections: Record<string, string>;
  aiSections: Array<{
    id: string;
    title: string;
    promptHint: string;
    maxWords?: number;
  }>;
  instructions: string;
}

export interface AssembledReport {
  reportId: string;
  type: AgentReportType;
  title: string;
  markdown: string;
  sections: Record<string, string>;
}
