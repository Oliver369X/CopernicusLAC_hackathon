import { getDbService } from '@/lib/db/get-service';
import { getFieldByIdFromDb } from '@/lib/data/fields';
import {
  getSatelliteReadingsForZoneRange,
  getSatelliteHistoryForZone,
} from '@/lib/data/zone-satellite-metrics';
import {
  getHistoryDaysForField,
  getHistoryStartForField,
  hasThreeYearHistory,
} from '@/lib/integrations/geodata/history-window';
import { getParcelSeries } from '@/lib/integrations/geodata/client';
import { isGeodataEnabled } from '@/lib/integrations/geodata/registry';
import { resolveFieldGeodataLink } from '@/lib/integrations/geodata/resolve-parcel-key';
import type { GeodataDataQuality } from '@/lib/integrations/geodata/types';

export type TimeseriesSource = 'geodata' | 'satellite_readings' | 'none';

export interface TimeseriesPoint {
  date: string;
  ndvi: number;
  ndre: number | null;
  ndmi: number | null;
  evi: number | null;
  dpRvi: number | null;
}

export interface ResolvedTimeseries {
  points: TimeseriesPoint[];
  source: TimeseriesSource;
  dataQuality?: GeodataDataQuality;
  parcelKey?: string;
  fallbackUsed: boolean;
}

const SEED_SOURCES = new Set(['copernicus-personas-3y', 'seed-sj-demo', 'seed']);

function defaultFromTo(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - days);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

async function loadLocalSeries(
  zoneId: string,
  fieldId: string,
  from?: string,
  to?: string,
  days = 90,
  excludeSeed = false
): Promise<TimeseriesPoint[]> {
  const service = await getDbService();
  if (!service) return [];

  const range = from && to ? { from, to } : defaultFromTo(days);
  const history = await getSatelliteReadingsForZoneRange(
    service,
    zoneId,
    range.from,
    range.to
  );
  const rows = history.length
    ? history
    : await getSatelliteHistoryForZone(service, zoneId, days);

  return rows
    .filter((h) => !excludeSeed || !SEED_SOURCES.has(String(h.source ?? '')))
    .map((h) => ({
      date: (h.reading_date ?? h.captured_at.slice(0, 10)) as string,
      ndvi: h.ndvi,
      ndre: h.ndre ?? null,
      ndmi: h.ndmi,
      evi: (h.science_metadata as { evi?: number } | null)?.evi ?? null,
      dpRvi: (h.science_metadata as { dpRvi?: number } | null)?.dpRvi ?? null,
    }));
}

export async function resolveTimeseriesForField(
  fieldId: string,
  zoneId?: string,
  options?: { from?: string; to?: string; days?: number }
): Promise<ResolvedTimeseries> {
  const field = await getFieldByIdFromDb(fieldId);
  if (!field) {
    return { points: [], source: 'none', fallbackUsed: false };
  }

  const zone = field.zones.find((z) => z.id === zoneId) ?? field.zones[0];
  if (!zone) {
    return { points: [], source: 'none', fallbackUsed: false };
  }

  const days = options?.days ?? (hasThreeYearHistory(fieldId) ? 1095 : 90);
  const startDate = options?.from ?? getHistoryStartForField(fieldId);
  const historyDays = getHistoryDaysForField(fieldId);

  if (isGeodataEnabled()) {
    const link = await resolveFieldGeodataLink(fieldId);
    if (link?.parcelKey) {
      const series = await getParcelSeries(
        link.parcelKey,
        historyDays,
        'optical',
        startDate,
        options?.to
      );
      if (series && series.count > 0 && series.dataQuality === 'cdse') {
        return {
          points: series.series.map((p) => ({
            date: p.date,
            ndvi: p.ndvi,
            ndre: null,
            ndmi: p.ndwi,
            evi: p.evi,
            dpRvi: null,
          })),
          source: 'geodata',
          dataQuality: series.dataQuality,
          parcelKey: link.parcelKey,
          fallbackUsed: false,
        };
      }
    }
  }

  const localExcludeSeed = isGeodataEnabled();
  const local = await loadLocalSeries(
    zone.id,
    fieldId,
    options?.from,
    options?.to,
    days,
    localExcludeSeed
  );
  if (local.length) {
    return {
      points: local,
      source: 'satellite_readings',
      fallbackUsed: isGeodataEnabled(),
    };
  }

  const fallbackLocal = await loadLocalSeries(
    zone.id,
    fieldId,
    options?.from,
    options?.to,
    days,
    false
  );

  return {
    points: fallbackLocal,
    source: fallbackLocal.length ? 'satellite_readings' : 'none',
    fallbackUsed: true,
  };
}
