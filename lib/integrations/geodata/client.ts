import { getGeodataApiKey, getGeodataBaseUrl, isGeodataEnabled } from './registry';
import type { IntelligencePackage } from './types';

async function fetchJson<T>(
  path: string,
  params?: Record<string, string>
): Promise<T | null> {
  if (!isGeodataEnabled()) return null;
  const base = getGeodataBaseUrl().replace(/\/$/, '');
  const url = new URL(`${base}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const headers: Record<string, string> = { Accept: 'application/json' };
  const apiKey = getGeodataApiKey();
  if (apiKey) headers['X-API-Key'] = apiKey;

  const res = await fetch(url.toString(), {
    headers,
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

/** Inteligencia por parcel_key (Data-Historica /v1/features/parcel/{key}). */
export async function getParcelIntelligence(
  parcelKey: string,
  enrich = true
): Promise<IntelligencePackage | null> {
  const params = enrich ? { enrich: 'true' } : undefined;
  const raw = await fetchJson<Record<string, unknown>>(
    `/v1/features/parcel/${encodeURIComponent(parcelKey)}`,
    params
  );
  return raw ? mapIntelligencePackage(raw) : null;
}

/** Inteligencia por punto (Data-Historica /v1/features/point). */
export async function getPointIntelligence(
  lat: number,
  lng: number,
  enrich = true
): Promise<IntelligencePackage | null> {
  const params: Record<string, string> = {
    lat: String(lat),
    lon: String(lng),
    region: 'SC-BO',
  };
  if (enrich) params.enrich = 'true';
  const raw = await fetchJson<Record<string, unknown>>('/v1/features/point', params);
  return raw ? mapIntelligencePackage(raw) : null;
}

function mapIntelligencePackage(raw: Record<string, unknown>): IntelligencePackage {
  const optical = raw.optical as Record<string, unknown> | undefined;
  const fire = raw.fire as Record<string, unknown> | undefined;
  return {
    parcelKey: String(raw.unit_key ?? raw.parcelKey ?? ''),
    regionCode: String(raw.region_code ?? 'SC-BO'),
    optical: optical
      ? {
          ndviMean: optical.ndvi_mean as number | null | undefined,
          ndmiMean: optical.ndwi_mean as number | null | undefined,
          cloudFraction: (optical.lineage as Record<string, unknown> | undefined)
            ?.cloud_fraction as number | null | undefined,
        }
      : undefined,
    fire: fire
      ? {
          hotspotCount7d: fire.fire_count as number | null | undefined,
          frpSum7d: fire.fire_risk_score as number | null | undefined,
        }
      : undefined,
    fetchedAt: String(raw.computed_at ?? new Date().toISOString()),
    source: 'data-historica',
  };
}
