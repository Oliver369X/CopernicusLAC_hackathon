import { getDbService } from '@/lib/db/get-service';
import {
  getLatestSatelliteForZones,
  getSatelliteHistoryForZone,
  getLatestWeatherForField,
} from '@/lib/data/zone-satellite-metrics';
import { resolveFieldGeodataLink } from '@/lib/integrations/geodata/resolve-parcel-key';
import {
  getHistoryDaysForField,
  hasThreeYearHistory,
  historyWindowLabel,
} from '@/lib/integrations/geodata/history-window';
import { isGeodataEnabled } from '@/lib/integrations/geodata/registry';
import { getParcelSeries } from '@/lib/integrations/geodata/client';
import type { AgentScope, ScopedFieldContext } from '@/lib/agents/scope';
import { dbQuery } from '@/lib/db/pool';
import { isDatabaseConfigured } from '@/lib/db/config';

export interface AgentContextPack {
  scope: {
    orgName: string;
    userEmail: string;
    billingModel: string;
    personaHint: string;
  };
  focus: {
    fieldId: string;
    fieldName: string;
    areaHa: number;
    crop: string;
    zoneId?: string;
    zoneName?: string;
    ndvi?: number;
    ndmi?: number;
    health?: string;
    diseaseRisks?: string[];
  };
  alerts: Array<{ title: string; severity: string; resolved: boolean }>;
  observations: Array<{ date: string; notes: string }>;
  satellite: { latestNdvi?: number; historyPoints: number };
  geodata?: {
    parcelKey: string;
    historyWindow?: string;
    seriesCount?: number;
    trend?: string;
  };
  isolationNote: string;
}

export async function buildAgentContextPack(
  scope: AgentScope,
  ctx: ScopedFieldContext
): Promise<AgentContextPack> {
  const { field, zone } = ctx;
  const zoneId = zone?.id;
  const service = await getDbService();

  let alerts: AgentContextPack['alerts'] = [];
  let observations: AgentContextPack['observations'] = [];
  let latestNdvi: number | undefined;
  let historyPoints = 0;

  if (service) {
    let alertQuery = service
      .from('alerts')
      .select('title, severity, resolved')
      .eq('field_id', field.id)
      .order('created_at', { ascending: false })
      .limit(8);
    if (zoneId) alertQuery = alertQuery.eq('zone_id', zoneId);
    const { data: alertRows } = await alertQuery;
    alerts = (alertRows ?? []) as AgentContextPack['alerts'];
  }

  if (isDatabaseConfigured()) {
    const obsSql = zoneId
      ? `SELECT notes, created_at FROM observations
         WHERE field_id = $1 AND zone_id = $2
         ORDER BY created_at DESC LIMIT 8`
      : `SELECT notes, created_at FROM observations
         WHERE field_id = $1 ORDER BY created_at DESC LIMIT 8`;
    const obsRows = await dbQuery<{ notes: string; created_at: string }>(
      obsSql,
      zoneId ? [field.id, zoneId] : [field.id]
    );
    observations = obsRows.map((r) => ({
      date: r.created_at.slice(0, 10),
      notes: r.notes,
    }));
  }

  if (service && zoneId) {
    const satMap = await getLatestSatelliteForZones(service, [zoneId]);
    const latest = satMap.get(zoneId);
    latestNdvi = latest?.ndvi ?? zone?.ndviAverage;
    const hist = await getSatelliteHistoryForZone(
      service,
      zoneId,
      hasThreeYearHistory(field.id) ? 1095 : 90
    );
    historyPoints = hist.length;
    await getLatestWeatherForField(service, field.id);
  }

  let geodataBlock: AgentContextPack['geodata'];
  if (isGeodataEnabled()) {
    const link = await resolveFieldGeodataLink(field.id);
    if (link?.parcelKey) {
      const days = getHistoryDaysForField(field.id);
      const series = await getParcelSeries(link.parcelKey, days, 'optical', undefined);
      geodataBlock = {
        parcelKey: link.parcelKey,
        historyWindow: historyWindowLabel(field.id),
        seriesCount: series?.count,
        trend: series?.historySummary?.trend,
      };
    }
  }

  const personaHint =
    scope.billingModel === 'hectare'
      ? 'Productora/o familiar — lenguaje simple, una parcela, seguridad alimentaria'
      : 'Cooperativa / técnico — zonas, comparación, tendencias multi-sector';

  return {
    scope: {
      orgName: scope.orgName,
      userEmail: scope.userEmail,
      billingModel: scope.billingModel,
      personaHint,
    },
    focus: {
      fieldId: field.id,
      fieldName: field.name,
      areaHa: field.area,
      crop: field.crop,
      zoneId: zone?.id,
      zoneName: zone?.name,
      ndvi: zone?.ndviAverage ?? field.zones[0]?.ndviAverage,
      ndmi: zone?.ndmiAverage,
      health: zone?.health,
      diseaseRisks: zone?.diseaseRisks,
    },
    alerts,
    observations,
    satellite: { latestNdvi, historyPoints },
    geodata: geodataBlock,
    isolationNote:
      'SOLO datos de la organización del usuario. No mencionar campos de otras cuentas demo.',
  };
}
