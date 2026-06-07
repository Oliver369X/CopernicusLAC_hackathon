import { readFileSync } from 'fs';
import { join } from 'path';
import { getDbService } from '@/lib/db/get-service';
import { getFields } from '@/lib/data/fields';
import { buildInsightsContext } from '@/lib/data/insights-context';
import {
  getLatestSatelliteForZones,
  getSatelliteHistoryForZone,
  getLatestWeatherForField,
} from '@/lib/data/zone-satellite-metrics';
import { analyzeCropMultisensor } from '@/lib/science/analyze';
import { isScienceCrop } from '@/lib/science/crops/registry';
import type { ScienceCropId } from '@/lib/science/types';
import { DEMO_PASSWORD, DEMO_USERS } from '@/lib/constants/demo-credentials';
import { APP_NAME } from '@/lib/constants/app-brand';
import type { AgentToolDefinition } from '@/lib/agents/types';
import type { AgentScope } from '@/lib/agents/scope';
import { loadOrgFields } from '@/lib/agents/scope';
import { dbQueryOne, dbQuery } from '@/lib/db/pool';
import { isDatabaseConfigured } from '@/lib/db/config';
import { listReportTemplateSummaries } from '@/lib/agents/reports/templates';
import {
  assembleReport,
  prepareReportDraft,
} from '@/lib/agents/reports/build-report-draft';

const SKILLS_DIR = join(process.cwd(), 'lib/agents/skills');

let activeScope: AgentScope | null = null;

export function runWithAgentScope<T>(scope: AgentScope, fn: () => Promise<T>): Promise<T> {
  const prev = activeScope;
  activeScope = scope;
  return fn().finally(() => {
    activeScope = prev;
  });
}

function requireScope(): AgentScope {
  if (!activeScope) {
    throw new Error('Agent scope no inicializado');
  }
  return activeScope;
}

async function orgFields() {
  return loadOrgFields(requireScope());
}

export const AGENT_TOOLS: AgentToolDefinition[] = [
  {
    name: 'getFieldsSummary',
    description: 'Resumen de campos, zonas y NDVI actual desde satellite_readings',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'getZoneSatelliteDetail',
    description: 'Última lectura satelital e historial 14 días de una zona',
    parameters: {
      type: 'object',
      properties: { zoneId: { type: 'string' } },
      required: ['zoneId'],
    },
  },
  {
    name: 'getActiveAlerts',
    description: 'Alertas activas no resueltas, opcionalmente filtradas por fieldId',
    parameters: {
      type: 'object',
      properties: { fieldId: { type: 'string' } },
      required: [],
    },
  },
  {
    name: 'getScienceAnalysis',
    description: 'Análisis científico multisensor (fusión reglas + ML) por cultivo/zona',
    parameters: {
      type: 'object',
      properties: {
        crop: { type: 'string' },
        fieldId: { type: 'string' },
        zoneId: { type: 'string' },
      },
      required: ['crop'],
    },
  },
  {
    name: 'getPlatformGuide',
    description: 'Guía de uso de la plataforma Aura Agro por tema',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          enum: ['monitor', 'cron', 'demo', 'routes'],
        },
      },
      required: ['topic'],
    },
  },
  {
    name: 'listDemoCredentials',
    description: 'Cuentas demo del hackathon con contraseña',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'getFieldObservations',
    description: 'Bitácora de campo del productor (solo org actual)',
    parameters: {
      type: 'object',
      properties: {
        fieldId: { type: 'string' },
        zoneId: { type: 'string' },
      },
      required: ['fieldId'],
    },
  },
  {
    name: 'explainZoneMetrics',
    description: 'Narrativa agronómica y acciones para una zona',
    parameters: {
      type: 'object',
      properties: { zoneId: { type: 'string' } },
      required: ['zoneId'],
    },
  },
  {
    name: 'listReportTemplates',
    description:
      'Lista plantillas de informe Aura (fitosanitario, histórico 3y, seguridad alimentaria, resumen finca, estado de zona)',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'prepareReportDraft',
    description:
      'Prepara borrador con datos reales y secciones auto; devuelve aiSections para que redactes solo el contenido',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: [
            'disease-situation',
            'historical-3y',
            'food-safety',
            'field-summary',
            'zone-status',
          ],
        },
        fieldId: { type: 'string' },
        zoneId: { type: 'string' },
      },
      required: ['type'],
    },
  },
  {
    name: 'assembleReport',
    description:
      'Ensambla informe final en markdown desde plantilla + sectionContent (texto AI por sectionId)',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: [
            'disease-situation',
            'historical-3y',
            'food-safety',
            'field-summary',
            'zone-status',
          ],
        },
        fieldId: { type: 'string' },
        zoneId: { type: 'string' },
        sectionContent: {
          type: 'object',
          description: 'Mapa sectionId → texto redactado por el agente',
        },
      },
      required: ['type', 'sectionContent'],
    },
  },
];

function readSkill(filename: string): string {
  try {
    return readFileSync(join(SKILLS_DIR, filename), 'utf-8');
  } catch {
    return '';
  }
}

export async function getFieldsSummary() {
  const service = await getDbService();
  const fields = await orgFields();
  const ctx = await buildInsightsContext(service, fields);
  return {
    fieldCount: fields.length,
    zoneCount: ctx.zones.length,
    satelliteZones: ctx.satelliteZoneCount,
    source: ctx.source,
    fields: ctx.correlationData,
    topStressZones: [...ctx.zones]
      .sort((a, b) => a.ndvi - b.ndvi)
      .slice(0, 3)
      .map((z) => ({
        zoneId: z.zoneId,
        name: z.zoneName,
        ndvi: z.ndvi,
        soilMoisture: z.soilMoisture,
        source: z.source,
      })),
  };
}

export async function getZoneSatelliteDetail(zoneId: string) {
  const service = await getDbService();
  const fields = await orgFields();
  const zone = fields.flatMap((f) => f.zones).find((z) => z.id === zoneId);
  if (!zone) return { error: 'Zona no encontrada en tu organización' };

  const field = fields.find((f) => f.id === zone.fieldId);
  if (!field) return { error: 'Campo no encontrado' };

  const satMap = service
    ? await getLatestSatelliteForZones(service, [zoneId])
    : new Map();
  const latest = satMap.get(zoneId);
  const history = service ? await getSatelliteHistoryForZone(service, zoneId, 14) : [];
  const weather = service ? await getLatestWeatherForField(service, field.id) : null;

  return {
    zoneId,
    zoneName: zone.name,
    fieldName: field.name,
    crop: field.crop,
    latest: latest ?? {
      ndvi: zone.ndviAverage,
      ndmi: zone.ndmiAverage,
      source: 'seed',
    },
    history,
    weather,
  };
}

export async function getActiveAlerts(fieldId?: string) {
  const service = await getDbService();
  if (!service) return { alerts: [], note: 'DB no configurada' };

  const fields = await orgFields();
  const allowedFieldIds = new Set(fields.map((f) => f.id));
  if (fieldId && !allowedFieldIds.has(fieldId)) {
    return { alerts: [], error: 'Campo fuera de tu organización' };
  }

  if (!fields.length) {
    return { alerts: [], note: 'Sin campos en la organización' };
  }

  let query = service
    .from('alerts')
    .select('id, field_id, zone_id, type, severity, title, description, recommendation')
    .eq('resolved', false)
    .order('created_at', { ascending: false })
    .limit(20);

  if (fieldId) query = query.eq('field_id', fieldId);
  else query = query.in('field_id', [...allowedFieldIds]);

  const { data } = await query;
  return { alerts: data ?? [] };
}

export async function getFieldObservations(fieldId: string, zoneId?: string) {
  const fields = await orgFields();
  if (!fields.some((f) => f.id === fieldId)) {
    return { error: 'Campo fuera de tu organización', observations: [] };
  }
  if (!isDatabaseConfigured()) return { observations: [] };

  const rows = zoneId
    ? await dbQuery<{ notes: string; created_at: string }>(
        `SELECT notes, created_at FROM observations
         WHERE field_id = $1 AND zone_id = $2 ORDER BY created_at DESC LIMIT 12`,
        [fieldId, zoneId]
      )
    : await dbQuery<{ notes: string; created_at: string }>(
        `SELECT notes, created_at FROM observations
         WHERE field_id = $1 ORDER BY created_at DESC LIMIT 12`,
        [fieldId]
      );

  return {
    observations: rows.map((r) => ({
      date: r.created_at.slice(0, 10),
      notes: r.notes,
    })),
  };
}

export async function getScienceAnalysis(
  crop: string,
  fieldId?: string,
  zoneId?: string
) {
  if (!isScienceCrop(crop)) {
    return { error: `Cultivo ${crop} no soportado en science lab` };
  }

  const fields = await orgFields();
  const field = fieldId
    ? fields.find((f) => f.id === fieldId)
    : fields.find((f) => f.crop === crop);

  if (!field) return { error: 'Campo no encontrado en tu organización' };

  const zone = field.zones.find((z) => z.id === zoneId) ?? field.zones[0];
  if (!zone) return { error: 'Zona no encontrada' };

  const service = await getDbService();
  const analysis = await analyzeCropMultisensor(
    crop as ScienceCropId,
    field,
    zone.id,
    service
  );

  return {
    crop,
    fieldId: field.id,
    zoneId: zone.id,
    fusionScore: analysis.fusionScore,
    fusionScoreMl: analysis.fusionScoreMl,
    healthLabel: analysis.healthLabel,
    source: analysis.source,
  };
}

export function getPlatformGuide(topic: string) {
  const map: Record<string, string> = {
    monitor: 'monitor-copernicus.md',
    cron: 'cron-satellite.md',
    demo: 'demo-narrative.md',
    routes: 'platform-routes.md',
  };
  const file = map[topic] ?? 'platform-routes.md';
  return { topic, content: readSkill(file) };
}

export async function explainZoneMetrics(zoneId: string) {
  const fields = await orgFields();
  const inOrg = fields.some((f) => f.zones.some((z) => z.id === zoneId));
  if (!inOrg) return { error: 'Zona fuera de tu organización' };

  if (!isDatabaseConfigured()) {
    return { error: 'Sin base de datos' };
  }
  const row = await dbQueryOne<{
    summary_es: string;
    actions: string[];
    phenology_hint: string | null;
    sources: string[];
  }>(
    `SELECT summary_es, actions, phenology_hint, sources FROM zone_insights WHERE zone_id = $1`,
    [zoneId]
  );
  if (!row) {
    return {
      zoneId,
      hint: 'Ejecutá cron narrative-batch o esperá la sincronización post-import',
    };
  }
  return { zoneId, ...row };
}

export function listDemoCredentials() {
  return {
    app: APP_NAME,
    password: DEMO_PASSWORD,
    users: DEMO_USERS.map((u) => ({
      email: u.email,
      role: u.role,
      label: u.label,
    })),
  };
}

export function listReportTemplates() {
  return { templates: listReportTemplateSummaries() };
}

export async function prepareReportDraftTool(
  type: string,
  fieldId?: string,
  zoneId?: string
) {
  const scope = requireScope();
  const fields = await orgFields();
  const resolvedFieldId = fieldId ?? fields[0]?.id;
  if (fieldId && !fields.some((f) => f.id === fieldId)) {
    return { error: 'Campo fuera de tu organización' };
  }
  const result = await prepareReportDraft(scope, type, resolvedFieldId, zoneId);
  if (!result.ok) return { error: result.error };
  return result.draft;
}

export async function assembleReportTool(
  type: string,
  sectionContent: Record<string, string>,
  fieldId?: string,
  zoneId?: string
) {
  const scope = requireScope();
  const fields = await orgFields();
  const resolvedFieldId = fieldId ?? fields[0]?.id;
  if (fieldId && !fields.some((f) => f.id === fieldId)) {
    return { error: 'Campo fuera de tu organización' };
  }
  const result = await assembleReport(
    scope,
    type,
    sectionContent,
    resolvedFieldId,
    zoneId
  );
  if (!result.ok) return { error: result.error };
  return result.report;
}

export async function executeAgentTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case 'getFieldsSummary':
      return getFieldsSummary();
    case 'getZoneSatelliteDetail':
      return getZoneSatelliteDetail(String(args.zoneId ?? ''));
    case 'getActiveAlerts':
      return getActiveAlerts(args.fieldId ? String(args.fieldId) : undefined);
    case 'getScienceAnalysis':
      return getScienceAnalysis(
        String(args.crop ?? 'soybean'),
        args.fieldId ? String(args.fieldId) : undefined,
        args.zoneId ? String(args.zoneId) : undefined
      );
    case 'getPlatformGuide':
      return getPlatformGuide(String(args.topic ?? 'routes'));
    case 'listDemoCredentials':
      return listDemoCredentials();
    case 'explainZoneMetrics':
      return explainZoneMetrics(String(args.zoneId ?? ''));
    case 'getFieldObservations':
      return getFieldObservations(
        String(args.fieldId ?? ''),
        args.zoneId ? String(args.zoneId) : undefined
      );
    case 'listReportTemplates':
      return listReportTemplates();
    case 'prepareReportDraft':
      return prepareReportDraftTool(
        String(args.type ?? ''),
        args.fieldId ? String(args.fieldId) : undefined,
        args.zoneId ? String(args.zoneId) : undefined
      );
    case 'assembleReport':
      return assembleReportTool(
        String(args.type ?? ''),
        (args.sectionContent as Record<string, string>) ?? {},
        args.fieldId ? String(args.fieldId) : undefined,
        args.zoneId ? String(args.zoneId) : undefined
      );
    default:
      return { error: `Tool desconocida: ${name}` };
  }
}
