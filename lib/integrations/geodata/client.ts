import { getGeodataApiKey, getGeodataBaseUrl, isGeodataEnabled } from './registry';
import type {
  FireFeatures,
  GeodataDataQuality,
  GeodataHistorySummary,
  GeodataResolutionSource,
  GeodataSeriesPoint,
  IntelligencePackage,
  OpticalFeatures,
  ParcelSeriesResponse,
  SarFeatures,
} from './types';

function logGeodataError(path: string, status: number): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[geodata] ${path} → HTTP ${status}`);
  }
}

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

  try {
    const res = await fetch(url.toString(), {
      headers,
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      logGeodataError(path, res.status);
      return null;
    }
    return (await res.json()) as T;
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[geodata] ${path} → fetch failed`);
    }
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

function mapOptical(raw: Record<string, unknown> | undefined): OpticalFeatures | undefined {
  if (!raw) return undefined;
  const lineage = asRecord(raw.lineage);
  const inputs = asRecord(raw.inputs);
  return {
    ndviMean: raw.ndvi_mean as number | null | undefined,
    ndmiMean: raw.ndwi_mean as number | null | undefined,
    cloudFraction:
      (lineage?.cloud_fraction as number | null | undefined) ??
      (inputs?.cloud_fraction as number | null | undefined),
    cropHealthStatus: raw.crop_health_status as string | null | undefined,
  };
}

function mapSar(raw: Record<string, unknown> | undefined): SarFeatures | undefined {
  if (!raw) return undefined;
  return {
    soilMoisture: raw.sar_soil_moisture as number | null | undefined,
    floodPct: raw.sar_flood_pct as number | null | undefined,
  };
}

function mapFire(raw: Record<string, unknown> | undefined): FireFeatures | undefined {
  if (!raw) return undefined;
  const inputs = asRecord(raw.inputs);
  return {
    hotspotCount7d: raw.fire_count as number | null | undefined,
    frpSum7d: raw.fire_risk_score as number | null | undefined,
    nearestKm: inputs?.nearest_km as number | null | undefined,
  };
}

export function mapIntelligencePackage(
  raw: Record<string, unknown>,
  resolutionSource: GeodataResolutionSource = 'parcel'
): IntelligencePackage {
  const optical = mapOptical(asRecord(raw.optical));
  const sar = mapSar(asRecord(raw.sar));
  const fire = mapFire(asRecord(raw.fire));
  const hist = asRecord(raw.history_summary);
  return {
    parcelKey: String(raw.unit_key ?? raw.parcelKey ?? ''),
    regionCode: String(raw.region_code ?? 'SC-BO'),
    optical,
    sar,
    fire,
    confidence: raw.confidence as number | null | undefined,
    summary: raw.summary as string | null | undefined,
    fetchedAt: String(raw.computed_at ?? new Date().toISOString()),
    source: 'data-historica',
    resolutionSource,
    historySummary: hist
      ? {
          windowDays: hist.window_days as number | undefined,
          observations: hist.observations as number | undefined,
          ndviMin: hist.ndvi_min as number | null | undefined,
          ndviMax: hist.ndvi_max as number | null | undefined,
          ndviLatest: hist.ndvi_latest as number | null | undefined,
          trend: hist.trend as string | undefined,
        }
      : undefined,
  };
}

export async function getParcelIntelligence(
  parcelKey: string,
  enrich = true
): Promise<IntelligencePackage | null> {
  const params = enrich ? { enrich: 'true' } : undefined;
  const raw = await fetchJson<Record<string, unknown>>(
    `/v1/features/parcel/${encodeURIComponent(parcelKey)}`,
    params
  );
  return raw ? mapIntelligencePackage(raw, 'parcel') : null;
}

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
  return raw ? mapIntelligencePackage(raw, 'point') : null;
}

export async function getRegionIntelligence(
  regionCode: string
): Promise<IntelligencePackage | null> {
  const raw = await fetchJson<Record<string, unknown>>(
    `/v1/features/region/${encodeURIComponent(regionCode)}`
  );
  return raw ? mapIntelligencePackage(raw, 'region') : null;
}

function inferDataQuality(
  series: GeodataSeriesPoint[],
  explicit?: string
): GeodataDataQuality {
  if (explicit === 'cdse' || explicit === 'demo' || explicit === 'mixed' || explicit === 'empty') {
    return explicit;
  }
  if (!series.length) return 'empty';
  const dates = series.map((p) => p.date);
  const uniqueDates = new Set(dates);
  const duplicateDates = uniqueDates.size !== dates.length;
  const monthlyOn15 = dates.every((d) => d.endsWith('-15'));
  if (monthlyOn15 && duplicateDates) return 'demo';
  if (duplicateDates) return 'mixed';
  return 'cdse';
}

export function mapParcelSeries(raw: Record<string, unknown>): ParcelSeriesResponse {
  const seriesRaw = Array.isArray(raw.series) ? raw.series : [];
  const series: GeodataSeriesPoint[] = seriesRaw.map((row) => {
    const r = row as Record<string, unknown>;
    const date = String(r.sensing_date ?? r.obs_time ?? '').slice(0, 10);
    return {
      date,
      ndvi: Number(r.ndvi_mean ?? 0),
      ndwi: r.ndwi_mean != null ? Number(r.ndwi_mean) : null,
      evi: r.evi_mean != null ? Number(r.evi_mean) : null,
      cloudFreePct: r.cloud_free_pct != null ? Number(r.cloud_free_pct) : null,
    };
  });
  const hist = asRecord(raw.history_summary);
  const providersRaw = raw.source_providers;
  const sourceProviders = Array.isArray(providersRaw)
    ? providersRaw.map((p) => String(p))
    : undefined;
  const dataQuality = inferDataQuality(
    series,
    raw.data_quality as string | undefined
  );
  return {
    parcelKey: String(raw.parcel_key ?? raw.unit_key ?? ''),
    featureSet: (raw.feature_set as 'optical' | 'sar') ?? 'optical',
    days: Number(raw.days ?? 365),
    count: Number(raw.count ?? series.length),
    series,
    historySummary: hist
      ? {
          windowDays: hist.window_days as number | undefined,
          observations: hist.observations as number | undefined,
          ndviMin: hist.ndvi_min as number | null | undefined,
          ndviMax: hist.ndvi_max as number | null | undefined,
          ndviLatest: hist.ndvi_latest as number | null | undefined,
          trend: hist.trend as string | undefined,
        }
      : null,
    dataQuality,
    sourceProviders,
    dedupApplied: raw.dedup_applied === true,
  };
}

export async function getParcelSeries(
  parcelKey: string,
  days = 365,
  featureSet: 'optical' | 'sar' = 'optical',
  startDate?: string,
  endDate?: string
): Promise<ParcelSeriesResponse | null> {
  const params: Record<string, string> = {
    feature_set: featureSet,
    days: String(days),
  };
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const raw = await fetchJson<Record<string, unknown>>(
    `/v1/features/parcel/${encodeURIComponent(parcelKey)}/series`,
    params
  );
  return raw ? mapParcelSeries(raw) : null;
}

export async function checkGeodataHealth(): Promise<{
  healthStatus: number;
  dbConnected: boolean;
}> {
  const raw = await fetchJson<{ db_connected?: boolean }>('/v1/health');
  return {
    healthStatus: raw ? 200 : 0,
    dbConnected: Boolean(raw?.db_connected),
  };
}

export async function probeParcelEndpoint(
  parcelKey: string
): Promise<number> {
  if (!isGeodataEnabled()) return 0;
  const base = getGeodataBaseUrl().replace(/\/$/, '');
  const headers: Record<string, string> = { Accept: 'application/json' };
  const apiKey = getGeodataApiKey();
  if (apiKey) headers['X-API-Key'] = apiKey;
  try {
    const res = await fetch(
      `${base}/v1/features/parcel/${encodeURIComponent(parcelKey)}?enrich=true`,
      { headers, signal: AbortSignal.timeout(8_000) }
    );
    return res.status;
  } catch {
    return 0;
  }
}
