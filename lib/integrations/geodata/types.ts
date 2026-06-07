/** Tipos alineados con Data-Historica-Microservicios IntelligencePackage. */

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
}

export interface GeodataHealthStatus {
  ok: boolean;
  geodataEnabled: boolean;
  baseUrl?: string;
  healthStatus?: number;
  dbConnected?: boolean;
  parcelSample?: string;
  parcelStatus?: number;
  reason?: string;
}
