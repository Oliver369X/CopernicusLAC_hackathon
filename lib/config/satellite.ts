import { hasCopernicusCredentials, hasSentinelHubCredentials } from '@/lib/services/copernicus/auth';

export function isSatelliteStrictMode(): boolean {
  return process.env.SATELLITE_STRICT === 'true';
}

export function hasSatelliteCredentialsConfigured(): boolean {
  return hasCopernicusCredentials() || hasSentinelHubCredentials();
}
