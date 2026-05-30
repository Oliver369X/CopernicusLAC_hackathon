import type { GeoBounds } from '@/lib/types/field';
import type { SatelliteMetrics } from './sentinel-hub-types';

function boundsCentroid(bounds: GeoBounds): { lat: number; lng: number } {
  const lat = bounds.reduce((s, p) => s + p.lat, 0) / bounds.length;
  const lng = bounds.reduce((s, p) => s + p.lng, 0) / bounds.length;
  return { lat, lng };
}

async function getSentinelToken(): Promise<string | null> {
  const clientId = process.env.SENTINEL_HUB_CLIENT_ID;
  const clientSecret = process.env.SENTINEL_HUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch('https://services.sentinel-hub.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/** Legacy Sentinel Hub commercial fallback (single-pixel). */
export async function fetchSatelliteMetricsLegacy(
  bounds: GeoBounds,
  fallbackNdvi = 0.55,
  fallbackNdmi = 0.4
): Promise<SatelliteMetrics> {
  const token = await getSentinelToken();
  const { lat, lng } = boundsCentroid(bounds);

  if (!token) {
    return {
      ndvi: fallbackNdvi,
      ndmi: fallbackNdmi,
      source: 'mock',
      capturedAt: new Date().toISOString(),
      rawMetadata: { reason: 'no_sentinel_credentials' },
    };
  }

  const evalscript = `
    //VERSION=3
    function setup() { return { input: ["B04","B08","B11"], output: { bands: 2 } }; }
    function evaluatePixel(s) {
      let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04);
      let ndmi = (s.B08 - s.B11) / (s.B08 + s.B11);
      return [ndvi, ndmi];
    }
  `;

  const half = 0.005;
  const requestBody = {
    input: {
      bounds: {
        bbox: [lng - half, lat - half, lng + half, lat + half],
        properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' },
      },
      data: [{ type: 'sentinel-2-l2a', dataFilter: { maxCloudCoverage: 30 } }],
    },
    output: {
      width: 1,
      height: 1,
      responses: [{ identifier: 'default', format: { type: 'image/tiff' } }],
    },
    evalscript,
  };

  try {
    const res = await fetch('https://services.sentinel-hub.com/api/v1/process', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) throw new Error(`Sentinel Hub error: ${res.status}`);

    return {
      ndvi: fallbackNdvi,
      ndmi: fallbackNdmi,
      source: 'sentinel',
      capturedAt: new Date().toISOString(),
      rawMetadata: { lat, lng, status: 'processed_legacy' },
    };
  } catch {
    return {
      ndvi: fallbackNdvi,
      ndmi: fallbackNdmi,
      source: 'mock',
      capturedAt: new Date().toISOString(),
      rawMetadata: { error: 'sentinel_request_failed' },
    };
  }
}
