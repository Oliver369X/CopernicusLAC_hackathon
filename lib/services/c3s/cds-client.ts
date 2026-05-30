const DEFAULT_CDS_URL = 'https://cds.climate.copernicus.eu/api';

export function getCdsApiUrl(): string {
  return process.env.CDS_API_URL ?? DEFAULT_CDS_URL;
}

export function getCdsApiKey(): string | undefined {
  return process.env.CDS_API_KEY;
}

export function hasCdsCredentials(): boolean {
  return Boolean(getCdsApiKey());
}

/** Authenticated POST to CDS API (Bearer token from CDS profile). */
export async function cdsPost<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T | null> {
  const key = getCdsApiKey();
  if (!key) return null;

  const res = await fetch(`${getCdsApiUrl()}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!res?.ok) return null;
  return (await res.json()) as T;
}
