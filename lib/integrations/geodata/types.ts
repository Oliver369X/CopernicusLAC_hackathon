/** Tipos alineados con Data-Historica-Microservicios (stub local). */

export interface OpticalFeatures {
  ndviMean?: number | null;
  ndviStd?: number | null;
  ndmiMean?: number | null;
  cloudFraction?: number | null;
  sceneCount?: number | null;
}

export interface FireFeatures {
  hotspotCount7d?: number | null;
  frpSum7d?: number | null;
  nearestKm?: number | null;
}

export interface IntelligencePackage {
  parcelKey: string;
  regionCode: string;
  optical?: OpticalFeatures;
  fire?: FireFeatures;
  fetchedAt?: string;
  source?: string;
}
