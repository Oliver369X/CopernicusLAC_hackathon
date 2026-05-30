export type { SatelliteMetrics } from './sentinel-hub-types';
export { fetchSatelliteMetricsLegacy } from './sentinel-hub-legacy';
export {
  fetchSatelliteMetrics,
  fetchZoneSatelliteReading,
  hasSatelliteCredentials,
} from './satellite/index';
