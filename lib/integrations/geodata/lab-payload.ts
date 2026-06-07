import {
  getHistoryDaysForField,
  getHistoryStartForField,
  historyWindowLabel,
} from '@/lib/integrations/geodata/history-window';
import {
  getParcelIntelligence,
  getParcelSeries,
  getRegionIntelligence,
} from '@/lib/integrations/geodata/client';
import {
  DEMO_PERSONAS,
  getDemoScenario,
} from '@/lib/integrations/geodata/demo-scenarios';
import { isGeodataEnabled } from '@/lib/integrations/geodata/registry';
import { resolveFieldGeodataLink } from '@/lib/integrations/geodata/resolve-parcel-key';
import type { GeodataLabPayload } from '@/lib/integrations/geodata/types';

export async function buildGeodataLabPayload(fieldId: string): Promise<GeodataLabPayload> {
  if (!fieldId) {
    return { enabled: false, fieldId: '' };
  }

  if (!isGeodataEnabled()) {
    return { enabled: false, fieldId };
  }

  const scenario = getDemoScenario(fieldId);
  const link = await resolveFieldGeodataLink(fieldId);
  const parcelKey = link?.parcelKey;
  const regionCode = link?.regionCode ?? 'SC-BO';

  const days = getHistoryDaysForField(fieldId);
  const startDate = getHistoryStartForField(fieldId);

  const [intelligence, series, region] = await Promise.all([
    parcelKey ? getParcelIntelligence(parcelKey, true) : Promise.resolve(null),
    parcelKey
      ? getParcelSeries(parcelKey, days, 'optical', startDate)
      : Promise.resolve(null),
    getRegionIntelligence(regionCode),
  ]);

  const persona = scenario?.persona;

  return {
    enabled: true,
    fieldId,
    parcelKey,
    persona,
    personaLabel: persona ? DEMO_PERSONAS[persona].label : undefined,
    highlight: scenario?.highlight,
    historyWindow: historyWindowLabel(fieldId),
    intelligence,
    series,
    region,
  };
}
