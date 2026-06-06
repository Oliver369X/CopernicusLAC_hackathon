import type { DbClient } from '@/lib/db/adapter';
import type { Field } from '@/lib/types/field';
import {
  getSatelliteHistoryForZone,
  getSatelliteReadingForZoneOnDate,
  getNearestReadingOnOrBefore,
  listAvailableReadingDates,
  getSatelliteReadingsForZoneRange,
  type ZoneSatelliteSnapshot,
} from '@/lib/data/zone-satellite-metrics';
import { fetchS2ExtendedStatistics, fetchS1ExtendedStatistics } from '@/lib/services/copernicus/statistics';
import { estimateS1Textures } from '@/lib/services/copernicus/process-textures';
import { hasSatelliteCredentialsConfigured } from '@/lib/config/satellite';
import { opticalFromStats } from './indices/optical';
import { radarFromStats, computeDpRvi, computeRvi } from './indices/radar';
import { assembleMultisensorAnalysis } from './fusion/multisensor-score';
import {
  buildTemporalSignature,
  detectTemporalAnomalies,
  type TimeSeriesPoint,
} from './phenology/temporal-signature';
import { detectParcelOutlier } from './phenology/outlier-detector';
import { getScienceProfile, isScienceCrop } from './crops/registry';
import type { AnalyzeOptions, MultisensorAnalysis, ScienceCropId } from './types';
import { enrichWithMl } from './ml/predict';
import { SCIENCE_ALGORITHM_VERSION } from './version';
import { inferProductionClass } from './agroforestry/classifier';
import { isGeodataEnabled } from '@/lib/integrations/geodata/registry';
import { getParcelKeyForField } from '@/lib/integrations/geodata/registry';
import { getParcelIntelligence } from '@/lib/integrations/geodata/client';
import { enrichAnalysisWithGeodata } from '@/lib/integrations/geodata/mapper';

function snapshotToOpticalRadar(
  snapshot: ZoneSatelliteSnapshot,
  meta?: Record<string, unknown>
) {
  const optical = opticalFromStats({
    ndvi: snapshot.ndvi,
    ndre: snapshot.ndre ?? snapshot.ndvi * 0.85,
    ndmi: snapshot.ndmi,
    evi: meta?.evi as number | undefined,
    ...(meta?.optical as Record<string, number | undefined> | undefined),
  });
  let radar = radarFromStats({});
  if (meta?.s1_vv != null && meta?.s1_vh != null) {
    const vv = Number(meta.s1_vv);
    const vh = Number(meta.s1_vh);
    radar = radarFromStats({
      vv,
      vh,
      dpRvi: (meta?.dpRvi as number) ?? computeDpRvi(vv, vh),
      rvi: computeRvi(vv, vh),
      ...(meta?.radar as Record<string, number | undefined> | undefined),
    });
  }
  const lst = (meta?.lst as number) ?? snapshot.s3Lst ?? null;
  return { optical, radar, lst };
}

function historyFromRows(
  rows: Array<{
    captured_at: string;
    ndvi: number;
    ndre?: number | null;
    s1_vv?: number | null;
    s1_vh?: number | null;
    science_metadata?: { dpRvi?: number } | null;
  }>
): TimeSeriesPoint[] {
  return rows.map((r) => ({
    capturedAt: r.captured_at,
    ndvi: r.ndvi,
    ndre: r.ndre,
    dpRvi:
      r.science_metadata?.dpRvi ??
      (r.s1_vv && r.s1_vh ? computeDpRvi(r.s1_vv, r.s1_vh) : null),
  }));
}

export async function analyzeCropMultisensor(
  crop: ScienceCropId,
  field: Field,
  zoneId: string,
  service: DbClient | null,
  options?: AnalyzeOptions
): Promise<MultisensorAnalysis> {
  const zone = field.zones.find((z) => z.id === zoneId) ?? field.zones[0];
  const profile = getScienceProfile(crop);
  const allowLiveFetch = options?.allowLiveFetch === true;
  let liveFetchUsed = false;

  let availableDates: string[] = [];
  let readingDate = options?.asOfDate ?? '';
  let snapshot: ZoneSatelliteSnapshot | null = null;
  let sceneDate: string | null = null;
  let capturedAt = new Date().toISOString();

  if (service) {
    availableDates = await listAvailableReadingDates(service, zone.id);

    if (!readingDate && availableDates.length > 0) {
      readingDate = availableDates[0];
    }
    if (!readingDate) {
      readingDate = new Date().toISOString().split('T')[0];
    }

    if (options?.asOfDate) {
      snapshot = await getSatelliteReadingForZoneOnDate(
        service,
        zone.id,
        options.asOfDate
      );
      if (!snapshot) {
        snapshot = await getNearestReadingOnOrBefore(
          service,
          zone.id,
          options.asOfDate
        );
      }
      if (snapshot?.readingDate) {
        readingDate = snapshot.readingDate;
      }
    } else if (availableDates.length > 0) {
      snapshot = await getSatelliteReadingForZoneOnDate(
        service,
        zone.id,
        availableDates[0]
      );
      readingDate = availableDates[0];
    }
  } else if (!readingDate) {
    readingDate = new Date().toISOString().split('T')[0];
  }

  let history: TimeSeriesPoint[] = [];
  let optical = opticalFromStats({
    ndvi: zone.ndviAverage,
    ndre: zone.ndviAverage * 0.85,
    ndmi: zone.ndmiAverage,
  });
  let radar = radarFromStats({});
  let lst: number | null = null;
  let source: MultisensorAnalysis['source'] = 'mock';

  if (service) {
    const rangeEnd = readingDate;
    const rangeStart = new Date(`${rangeEnd}T12:00:00Z`);
    rangeStart.setUTCDate(rangeStart.getUTCDate() - 90);
    const fromStr = rangeStart.toISOString().split('T')[0];

    const rangeRows = await getSatelliteReadingsForZoneRange(
      service,
      zone.id,
      fromStr,
      rangeEnd
    );
    history =
      rangeRows.length > 0
        ? historyFromRows(rangeRows)
        : historyFromRows(await getSatelliteHistoryForZone(service, zone.id, 90));

    if (snapshot) {
      const { data: metaRow } = await service
        .from('satellite_readings')
        .select('science_metadata, s1_vv, s1_vh')
        .eq('zone_id', zone.id)
        .eq('reading_date', readingDate)
        .maybeSingle();

      const meta = (metaRow?.science_metadata ?? {}) as Record<string, unknown>;
      if (metaRow) {
        meta.s1_vv = metaRow.s1_vv;
        meta.s1_vh = metaRow.s1_vh;
      }

      const fromSnap = snapshotToOpticalRadar(snapshot, meta);
      optical = fromSnap.optical;
      radar = fromSnap.radar;
      lst = fromSnap.lst;
      sceneDate = snapshot.sceneDate;
      capturedAt = snapshot.capturedAt;
      source = 'database';
    } else if (!allowLiveFetch) {
      source = 'mock';
    }
  }

  if (allowLiveFetch && hasSatelliteCredentialsConfigured() && process.env.COPERNICUS_CLIENT_ID) {
    try {
      const copernicusTimeoutMs = 12_000;
      const withTimeout = <T>(promise: Promise<T>): Promise<T> =>
        Promise.race([
          promise,
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('Copernicus timeout')), copernicusTimeoutMs)
          ),
        ]);

      const [s2, s1] = await Promise.all([
        withTimeout(fetchS2ExtendedStatistics(zone.bounds)),
        withTimeout(fetchS1ExtendedStatistics(zone.bounds)),
      ]);
      if (s2.ndvi != null) {
        optical = opticalFromStats({
          ndvi: s2.ndvi,
          ndre: s2.ndre,
          ndmi: s2.ndmi,
          evi: s2.evi,
          savi: s2.savi,
          ndwi: s2.ndwi,
          msi: s2.msi,
          ciRedEdge: s2.ciRedEdge,
          redsi: s2.redsi,
        });
        source = 'live';
        liveFetchUsed = true;
        sceneDate = s2.sceneDate ?? sceneDate;
      }
      if (s1.vv != null && s1.vh != null) {
        radar = radarFromStats({
          vv: s1.vv,
          vh: s1.vh,
          rvi: s1.rvi,
          dpRvi: s1.dpRvi,
        });
      }
      if (crop === 'coffee' || crop === 'cacao') {
        const tex = await estimateS1Textures(zone.bounds);
        if (tex) radar = { ...radar, sarContrast: tex.contrast, sarHomogeneity: tex.homogeneity };
      }
    } catch {
      if (!snapshot) source = 'mock';
    }
  }

  let temporal = buildTemporalSignature(history, field.daysFromPlanting, profile);
  if (history.length >= 5 && optical.ndvi != null) {
    const outlier = detectParcelOutlier(
      history.map((h) => ({ captured_at: h.capturedAt, ndvi: h.ndvi, ndmi: 0 })),
      optical.ndvi
    );
    temporal = { ...temporal, parcelOutlier: outlier };
  }

  let anomalyFlags = detectTemporalAnomalies(temporal, optical, crop);

  let productionClass: string | null = null;
  if (crop === 'coffee' || crop === 'cacao') {
    productionClass = inferProductionClass(optical, radar);
    if (productionClass === 'uncertain' || productionClass === 'forest_confusion_risk') {
      anomalyFlags.push('agroforestry_uncertainty');
    }
  }

  let analysis = assembleMultisensorAnalysis({
    crop,
    fieldId: field.id,
    zoneId: zone.id,
    capturedAt,
    optical,
    radar,
    temporal,
    anomalyFlags,
    source,
    lst,
  });

  analysis = enrichWithMl(analysis, field);
  analysis.productionClass = productionClass;
  analysis.algorithmVersion = SCIENCE_ALGORITHM_VERSION;
  analysis.provenance = {
    readingDate,
    sceneDate,
    capturedAt,
    dataSource: source,
    availableDates,
    liveFetchUsed,
  };

  if (isGeodataEnabled()) {
    try {
      const parcelKey = getParcelKeyForField(field.id);
      if (parcelKey) {
        const pkg = await getParcelIntelligence(parcelKey);
        if (pkg) analysis = enrichAnalysisWithGeodata(analysis, pkg);
      }
    } catch {
      // DB-first intacto
    }
  }

  return analysis;
}

export function resolveScienceCrop(field: Field): ScienceCropId | null {
  if (isScienceCrop(field.crop)) return field.crop;
  return null;
}
