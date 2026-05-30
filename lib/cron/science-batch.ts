import type { DbClient } from '@/lib/db/adapter';
import type { Field } from '@/lib/types/field';
import {
  fetchScienceVectorsForZone,
  scienceMetadataFromReading,
} from '@/lib/science/science-ingest';
import { analyzeCropMultisensor } from '@/lib/science/analyze';
import { persistScienceTimeseries } from '@/lib/science/persist-timeseries';
import { isScienceCrop } from '@/lib/science/crops/registry';
import type { ScienceCropId } from '@/lib/science/types';

export async function runScienceBatchJob(
  service: DbClient,
  fields: Field[]
): Promise<{ analyzed: number; timeseries: number }> {
  let analyzed = 0;
  let timeseries = 0;

  for (const field of fields) {
    if (!isScienceCrop(field.crop)) continue;

    for (const zone of field.zones) {
      try {
        const analysis = await analyzeCropMultisensor(
          field.crop as ScienceCropId,
          field,
          zone.id,
          service
        );
        analyzed++;
        await persistScienceTimeseries(service, field.id, field.crop, analysis);
        timeseries++;
      } catch {
        // skip zone on failure
      }
    }
  }

  return { analyzed, timeseries };
}

export { fetchScienceVectorsForZone, scienceMetadataFromReading };
