export interface SatelliteMetrics {
  ndvi: number;
  ndmi: number;
  source: 'sentinel' | 'mock';
  capturedAt: string;
  rawMetadata?: Record<string, unknown>;
}
