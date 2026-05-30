const CDSE_TOKEN_URL =
  'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';

const SH_TOKEN_URL = 'https://services.sentinel-hub.com/oauth/token';

interface TokenCache {
  token: string;
  expiresAt: number;
}

let copernicusCache: TokenCache | null = null;
let sentinelHubCache: TokenCache | null = null;

async function fetchToken(
  url: string,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  return data.access_token;
}

export async function getCopernicusToken(): Promise<string | null> {
  const clientId = process.env.COPERNICUS_CLIENT_ID;
  const clientSecret = process.env.COPERNICUS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (copernicusCache && Date.now() < copernicusCache.expiresAt) {
    return copernicusCache.token;
  }

  const token = await fetchToken(CDSE_TOKEN_URL, clientId, clientSecret);
  if (!token) return null;

  copernicusCache = { token, expiresAt: Date.now() + 55 * 60 * 1000 };
  return token;
}

export async function getSentinelHubToken(): Promise<string | null> {
  const clientId = process.env.SENTINEL_HUB_CLIENT_ID;
  const clientSecret = process.env.SENTINEL_HUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (sentinelHubCache && Date.now() < sentinelHubCache.expiresAt) {
    return sentinelHubCache.token;
  }

  const token = await fetchToken(SH_TOKEN_URL, clientId, clientSecret);
  if (!token) return null;

  sentinelHubCache = { token, expiresAt: Date.now() + 55 * 60 * 1000 };
  return token;
}

export function hasCopernicusCredentials(): boolean {
  return Boolean(
    process.env.COPERNICUS_CLIENT_ID && process.env.COPERNICUS_CLIENT_SECRET
  );
}

export function hasSentinelHubCredentials(): boolean {
  return Boolean(
    process.env.SENTINEL_HUB_CLIENT_ID && process.env.SENTINEL_HUB_CLIENT_SECRET
  );
}
