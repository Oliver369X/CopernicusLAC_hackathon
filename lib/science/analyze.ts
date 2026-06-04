import type { DbClient } from '@/lib/db/adapter';
import type { Field } from '@/lib/types/field';
import { getSatelliteHistoryForZone } from '@/lib/data/zone-satellite-metrics';
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
import type { MultisensorAnalysis, ScienceCropId } from './types';
import { enrichWithMl } from './ml/predict';
import { SCIENCE_ALGORITHM_VERSION } from './version';
import { inferProductionClass } from './agroforestry/classifier';

export async function analyzeCropMultisensor(
  crop: ScienceCropId,
  field: Field,
  zoneId: string,
  service: DbClient | null
): Promise<MultisensorAnalysis> {
  const zone = field.zones.find((z) => z.id === zoneId) ?? field.zones[0];
  const profile = getScienceProfile(crop);
  const capturedAt = new Date().toISOString();

  let history: TimeSeriesPoint[] = [];
  let optical = opticalFromStats({
    ndvi: zone.ndviAverage,
    ndre: zone.ndviAverage * 0.85,
    ndmi: zone.ndmiAverage,
  });
  let radar = radarFromStats({});
  let lst: number | null = null;
  let source: MultisensorAnalysis['source'] = hasSatelliteCredentialsConfigured()
    ? 'live'
    : 'mock';

  if (service) {
    const rows = await getSatelliteHistoryForZone(service, zone.id, 90);
    history = rows.map((r) => ({
      capturedAt: r.captured_at,
      ndvi: r.ndvi,
      ndre: r.ndre,
      dpRvi:
        r.science_metadata?.dpRvi ??
        (r.s1_vv && r.s1_vh ? computeDpRvi(r.s1_vv, r.s1_vh) : null),
    }));

    const latest = rows[0];
    const meta = latest?.science_metadata as Record<string, unknown> | undefined;
    if (latest) {
      optical = opticalFromStats({
        ndvi: latest.ndvi,
        ndre: latest.ndre,
        ndmi: latest.ndmi,
        evi: meta?.evi as number | undefined,
        ...(meta?.optical as Record<string, number | undefined> | undefined),
      });
      if (latest.s1_vv != null && latest.s1_vh != null) {
        radar = radarFromStats({
          vv: latest.s1_vv,
          vh: latest.s1_vh,
          dpRvi: (meta?.dpRvi as number) ?? computeDpRvi(latest.s1_vv, latest.s1_vh),
          rvi: computeRvi(latest.s1_vv, latest.s1_vh),
          ...(meta?.radar as Record<string, number | undefined> | undefined),
        });
      }
      lst = (meta?.lst as number) ?? null;
      source = 'database';
    } else if (hasSatelliteCredentialsConfigured()) {
      source = 'live';
    }
  }

  if (process.env.COPERNICUS_CLIENT_ID) {
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
      // keep DB values
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

  return analysis;
}

export function resolveScienceCrop(field: Field): ScienceCropId | null {
  if (isScienceCrop(field.crop)) return field.crop;
  return null;
}
