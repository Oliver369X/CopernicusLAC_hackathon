/** Tipos alineados con Data-Historica-Microservicios IntelligencePackage. */

import type { DemoPersonaId } from './demo-scenarios';

export interface OpticalFeatures {
  ndviMean?: number | null;
  ndviStd?: number | null;
  ndmiMean?: number | null;
  cloudFraction?: number | null;
  sceneCount?: number | null;
  cropHealthStatus?: string | null;
}

export interface SarFeatures {
  soilMoisture?: number | null;
  floodPct?: number | null;
}

export interface FireFeatures {
  hotspotCount7d?: number | null;
  frpSum7d?: number | null;
  nearestKm?: number | null;
}

export type GeodataResolutionSource = 'parcel' | 'point' | 'region';

export interface IntelligencePackage {
  parcelKey: string;
  regionCode: string;
  optical?: OpticalFeatures;
  sar?: SarFeatures;
  fire?: FireFeatures;
  confidence?: number | null;
  summary?: string | null;
  fetchedAt?: string;
  source?: string;
  resolutionSource?: GeodataResolutionSource;
  historySummary?: GeodataHistorySummary;
}

export interface GeodataHistorySummary {
  windowDays?: number;
  observations?: number;
  ndviMin?: number | null;
  ndviMax?: number | null;
  ndviLatest?: number | null;
  trend?: 'stable' | 'improving' | 'declining' | string;
}

export type GeodataDataQuality = 'cdse' | 'demo' | 'mixed' | 'empty';

export interface GeodataSeriesPoint {
  date: string;
  ndvi: number;
  ndwi: number | null;
  evi: number | null;
  cloudFreePct: number | null;
}

export interface ParcelSeriesResponse {
  parcelKey: string;
  featureSet: 'optical' | 'sar';
  days: number;
  count: number;
  series: GeodataSeriesPoint[];
  historySummary?: GeodataHistorySummary | null;
  dataQuality?: GeodataDataQuality;
  sourceProviders?: string[];
  dedupApplied?: boolean;
}

export interface GeodataLabPayload {
  enabled: boolean;
  fieldId: string;
  parcelKey?: string;
  persona?: DemoPersonaId;
  personaLabel?: string;
  highlight?: string;
  historyWindow?: string;
  dataQuality?: GeodataDataQuality;
  sourceProviders?: string[];
  intelligence?: IntelligencePackage | null;
  series?: ParcelSeriesResponse | null;
  region?: IntelligencePackage | null;
}

export interface GeodataLabComparePayload {
  enabled: boolean;
  crop: string;
  cooperative: GeodataLabPayload;
  smallholder: GeodataLabPayload;
}

export interface GeodataHealthStatus {
  ok: boolean;
  geodataEnabled: boolean;
  baseUrl?: string;
  healthStatus?: number;
  dbConnected?: boolean;
  parcelSample?: string;
  parcelStatus?: number;
  seriesQuality?: Record<string, GeodataDataQuality>;
  reason?: string;
}
