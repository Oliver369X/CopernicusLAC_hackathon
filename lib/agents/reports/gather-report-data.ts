import { getDbService } from '@/lib/db/get-service';
import { buildInsightsContext } from '@/lib/data/insights-context';
import {
  getLatestSatelliteForZones,
  getSatelliteHistoryForZone,
} from '@/lib/data/zone-satellite-metrics';
import { resolveFieldGeodataLink } from '@/lib/integrations/geodata/resolve-parcel-key';
import {
  getHistoryDaysForField,
  hasThreeYearHistory,
  historyWindowLabel,
} from '@/lib/integrations/geodata/history-window';
import { isGeodataEnabled } from '@/lib/integrations/geodata/registry';
import { getParcelSeries } from '@/lib/integrations/geodata/client';
import type { AgentScope } from '@/lib/agents/scope';
import { loadOrgFields, resolveScopedFieldContext } from '@/lib/agents/scope';
import { dbQuery } from '@/lib/db/pool';
import { isDatabaseConfigured } from '@/lib/db/config';
import type { ReportDataSnapshot } from '@/lib/agents/reports/types';
import { APP_NAME } from '@/lib/constants/app-brand';

const DISCLAIMER =
  `Este informe es orientativo, generado con ${APP_NAME} a partir de datos satelitales Copernicus y bitácora de campo. ` +
  'No reemplaza la inspección presencial de un ingeniero agrónomo matriculado. Verificar normativa local antes de aplicar fitosanitarios.';

export { DISCLAIMER };

export async function gatherReportData(
  scope: AgentScope,
  fieldId?: string,
  zoneId?: string
): Promise<{ ok: true; snapshot: ReportDataSnapshot } | { ok: false; error: string }> {
  const resolved = await resolveScopedFieldContext(scope, fieldId, zoneId);
  if (!resolved.ok) return resolved;

  const { field, zone } = resolved.ctx;
  const zoneRef = zone ?? field.zones[0];
  const service = await getDbService();
  const fields = await loadOrgFields(scope);
  const ctx = await buildInsightsContext(service, fields);

  let alerts: ReportDataSnapshot['alerts'] = [];
  if (service) {
    let alertQuery = service
      .from('alerts')
      .select('title, severity, description')
      .eq('field_id', field.id)
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(12);
    if (zoneRef?.id) alertQuery = alertQuery.eq('zone_id', zoneRef.id);
    const { data } = await alertQuery;
    alerts = (data ?? []) as ReportDataSnapshot['alerts'];
  }

  let observations: ReportDataSnapshot['observations'] = [];
  if (isDatabaseConfigured()) {
    const obsSql = zoneRef?.id
      ? `SELECT notes, created_at FROM observations
         WHERE field_id = $1 AND zone_id = $2 ORDER BY created_at DESC LIMIT 15`
      : `SELECT notes, created_at FROM observations
         WHERE field_id = $1 ORDER BY created_at DESC LIMIT 15`;
    const rows = await dbQuery<{ notes: string; created_at: string }>(
      obsSql,
      zoneRef?.id ? [field.id, zoneRef.id] : [field.id]
    );
    observations = rows.map((r) => ({
      date: r.created_at.slice(0, 10),
      notes: r.notes,
    }));
  }

  let satelliteHistoryPoints = 0;
  if (service && zoneRef?.id) {
    const hist = await getSatelliteHistoryForZone(
      service,
      zoneRef.id,
      hasThreeYearHistory(field.id) ? 1095 : 90
    );
    satelliteHistoryPoints = hist.length;
    await getLatestSatelliteForZones(service, [zoneRef.id]);
  }

  let geodataBlock: ReportDataSnapshot['geodata'];
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

  const topStressZones = [...ctx.zones]
    .sort((a, b) => a.ndvi - b.ndvi)
    .slice(0, 5)
    .map((z) => ({ name: z.zoneName, ndvi: z.ndvi }));

  const snapshot: ReportDataSnapshot = {
    reportId: `AURA-RPT-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    orgName: scope.orgName,
    fieldId: field.id,
    fieldName: field.name,
    zoneId: zoneRef?.id,
    zoneName: zoneRef?.name,
    crop: field.crop,
    areaHa: zoneRef?.area ?? field.area,
    ndvi: zoneRef?.ndviAverage ?? field.zones[0]?.ndviAverage,
    ndmi: zoneRef?.ndmiAverage,
    health: zoneRef?.health,
    diseaseRisks: zoneRef?.diseaseRisks ?? [],
    alerts,
    observations,
    satelliteHistoryPoints,
    geodata: geodataBlock,
    topStressZones,
  };

  return { ok: true, snapshot };
}
