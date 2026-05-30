import type { FieldZone } from '@/lib/types/field';
import {
  fetchS1ExtendedStatistics,
  fetchS2ExtendedStatistics,
} from '@/lib/services/copernicus/statistics';
import { estimateS1Textures } from '@/lib/services/copernicus/process-textures';
import { opticalFromStats } from './indices/optical';
import { radarFromStats, computeDpRvi, computeRvi } from './indices/radar';
import { isScienceIngestCrop } from './crops/registry';
import { SCIENCE_ALGORITHM_VERSION } from './version';

export interface ScienceIngestPayload {
  optical: ReturnType<typeof opticalFromStats>;
  radar: ReturnType<typeof radarFromStats>;
  lst: number | null;
  algorithmVersion: string;
}

export async function fetchScienceVectorsForZone(
  zone: FieldZone,
  crop: string,
  s3Lst: number | null
): Promise<ScienceIngestPayload | null> {
  if (!isScienceIngestCrop(crop)) return null;

  try {
    const [s2, s1] = await Promise.all([
      fetchS2ExtendedStatistics(zone.bounds),
      fetchS1ExtendedStatistics(zone.bounds),
    ]);

    const optical = opticalFromStats({
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

    let radar = radarFromStats({
      vv: s1.vv,
      vh: s1.vh,
      rvi: s1.rvi,
      dpRvi: s1.dpRvi,
    });

    if (crop === 'coffee' || crop === 'cacao') {
      const tex = await estimateS1Textures(zone.bounds);
      if (tex) {
        radar = { ...radar, sarContrast: tex.contrast, sarHomogeneity: tex.homogeneity };
      }
    }

    return {
      optical,
      radar,
      lst: s3Lst,
      algorithmVersion: SCIENCE_ALGORITHM_VERSION,
    };
  } catch {
    return null;
  }
}

export function scienceMetadataFromReading(
  crop: string,
  s1Vv: number | null,
  s1Vh: number | null,
  vectors?: ScienceIngestPayload | null
): Record<string, unknown> | null {
  if (!isScienceIngestCrop(crop)) return null;
  const base: Record<string, unknown> = {
    crop,
    algorithmVersion: SCIENCE_ALGORITHM_VERSION,
  };
  if (s1Vv != null && s1Vh != null) {
    base.dpRvi = computeDpRvi(s1Vv, s1Vh);
    base.rvi = computeRvi(s1Vv, s1Vh);
  }
  if (vectors) {
    base.optical = vectors.optical;
    base.radar = vectors.radar;
    base.lst = vectors.lst;
  }
  return base;
}
