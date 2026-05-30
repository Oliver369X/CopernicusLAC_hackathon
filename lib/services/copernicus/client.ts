import { getCopernicusToken, getSentinelHubToken } from './auth';

export const CDSE_BASE = 'https://sh.dataspace.copernicus.eu';
export const SH_COMMERCIAL_BASE = 'https://services.sentinel-hub.com';

export type SatelliteBackend = 'copernicus' | 'sentinel_hub';

export function getSatelliteProvider(): SatelliteBackend {
  const provider = process.env.SATELLITE_PROVIDER ?? 'copernicus';
  return provider === 'sentinel_hub' ? 'sentinel_hub' : 'copernicus';
}

export async function getProviderConfig(): Promise<{
  backend: SatelliteBackend;
  baseUrl: string;
  token: string | null;
}> {
  const preferred = getSatelliteProvider();

  if (preferred === 'copernicus') {
    const token = await getCopernicusToken();
    if (token) {
      return { backend: 'copernicus', baseUrl: CDSE_BASE, token };
    }
  }

  const shToken = await getSentinelHubToken();
  if (shToken) {
    return { backend: 'sentinel_hub', baseUrl: SH_COMMERCIAL_BASE, token: shToken };
  }

  const cdseToken = preferred === 'sentinel_hub' ? await getCopernicusToken() : null;
  if (cdseToken) {
    return { backend: 'copernicus', baseUrl: CDSE_BASE, token: cdseToken };
  }

  return { backend: preferred, baseUrl: CDSE_BASE, token: null };
}

export async function cdseFetch(
  path: string,
  init: RequestInit
): Promise<Response> {
  const { baseUrl, token } = await getProviderConfig();
  if (!token) {
    throw new Error('No satellite credentials configured');
  }

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
    },
  });
}
