import type {
  AgentReportType,
  AssembledReport,
  ReportDraft,
  ReportTemplate,
} from '@/lib/agents/reports/types';
import type { AgentScope } from '@/lib/agents/scope';
import {
  REPORT_TEMPLATES,
  resolveReportType,
} from '@/lib/agents/reports/templates';
import {
  DISCLAIMER,
  gatherReportData,
} from '@/lib/agents/reports/gather-report-data';
import { loadOrgFields } from '@/lib/agents/scope';
import { getCropLabelEs } from '@/lib/design/tokens';

function formatHeader(snapshot: ReportDraft['snapshot'], template: ReportTemplate): string {
  const lines = [
    `# ${template.title}`,
    '',
    `**ID:** ${snapshot.reportId}`,
    `**Organización:** ${snapshot.orgName}`,
    `**Campo:** ${snapshot.fieldName}${snapshot.zoneName ? ` · ${snapshot.zoneName}` : ''}`,
    `**Cultivo:** ${getCropLabelEs(snapshot.crop)} · **Área:** ${snapshot.areaHa} ha`,
    `**Generado:** ${new Date(snapshot.generatedAt).toLocaleString('es-AR')}`,
  ];
  return lines.join('\n');
}

function formatMetrics(snapshot: ReportDraft['snapshot']): string {
  const lines = ['## Indicadores', ''];
  if (snapshot.ndvi != null) lines.push(`- **NDVI:** ${snapshot.ndvi.toFixed(3)}`);
  if (snapshot.ndmi != null) lines.push(`- **NDMI:** ${snapshot.ndmi.toFixed(3)}`);
  if (snapshot.health) lines.push(`- **Salud:** ${snapshot.health}`);
  if (snapshot.diseaseRisks.length) {
    lines.push(`- **Riesgos detectados:** ${snapshot.diseaseRisks.join(', ')}`);
  } else {
    lines.push('- **Riesgos detectados:** ninguno registrado');
  }
  lines.push(`- **Puntos satelitales en historial:** ${snapshot.satelliteHistoryPoints}`);
  return lines.join('\n');
}

function formatAlerts(snapshot: ReportDraft['snapshot']): string {
  if (!snapshot.alerts.length) {
    return '## Alertas activas\n\nSin alertas abiertas en el alcance seleccionado.';
  }
  const items = snapshot.alerts.map(
    (a) =>
      `- **[${a.severity}]** ${a.title}${a.description ? ` — ${a.description}` : ''}`
  );
  return ['## Alertas activas', '', ...items].join('\n');
}

function formatObservations(snapshot: ReportDraft['snapshot']): string {
  if (!snapshot.observations.length) {
    return '## Bitácora de campo\n\nSin observaciones registradas.';
  }
  const items = snapshot.observations.map((o) => `- **${o.date}:** ${o.notes}`);
  return ['## Bitácora de campo', '', ...items].join('\n');
}

function formatGeodata(snapshot: ReportDraft['snapshot']): string {
  if (!snapshot.geodata) {
    return '## Serie histórica\n\nGeo-data no vinculado o no disponible.';
  }
  const g = snapshot.geodata;
  return [
    '## Serie histórica (geo-data)',
    '',
    `- **Parcela:** ${g.parcelKey}`,
    `- **Ventana:** ${g.historyWindow ?? '—'}`,
    `- **Observaciones en serie:** ${g.seriesCount ?? '—'}`,
    `- **Tendencia:** ${g.trend ?? '—'}`,
  ].join('\n');
}

function formatPortfolio(_scope: AgentScope, snapshot: ReportDraft['snapshot']): string {
  return [
    '## Portfolio',
    '',
    `- **Campo foco:** ${snapshot.fieldName}`,
    `- **Zonas con mayor estrés (NDVI bajo):**`,
    ...snapshot.topStressZones.map((z) => `  - ${z.name}: NDVI ${z.ndvi.toFixed(3)}`),
  ].join('\n');
}

function formatSatelliteContext(snapshot: ReportDraft['snapshot']): string {
  return [
    '## Contexto satelital',
    '',
    `- **Puntos en historial:** ${snapshot.satelliteHistoryPoints}`,
    `- **Fuente:** Copernicus CDSE / lecturas en base`,
    snapshot.geodata
      ? `- **Serie geo-data:** ${snapshot.geodata.parcelKey} (${snapshot.geodata.historyWindow})`
      : '- **Serie geo-data:** no vinculada',
  ].join('\n');
}

function buildAutoSection(
  sectionId: string,
  template: ReportTemplate,
  snapshot: ReportDraft['snapshot'],
  scope: AgentScope
): string {
  switch (sectionId) {
    case 'header':
      return formatHeader(snapshot, template);
    case 'metrics':
      return formatMetrics(snapshot);
    case 'alerts-summary':
      return formatAlerts(snapshot);
    case 'observations-log':
    case 'traceability':
      return formatObservations(snapshot);
    case 'geodata-summary':
      return formatGeodata(snapshot);
    case 'portfolio':
      return formatPortfolio(scope, snapshot);
    case 'satellite-context':
      return formatSatelliteContext(snapshot);
    case 'disclaimer':
      return `## Aviso legal\n\n${DISCLAIMER}`;
    default:
      return `## ${template.sections.find((s) => s.id === sectionId)?.title ?? sectionId}\n\n—`;
  }
}

export async function prepareReportDraft(
  scope: AgentScope,
  typeInput: string,
  fieldId?: string,
  zoneId?: string
): Promise<{ ok: true; draft: ReportDraft } | { ok: false; error: string }> {
  const type = resolveReportType(typeInput) ?? (typeInput as AgentReportType);
  const template = REPORT_TEMPLATES[type];
  if (!template) {
    return {
      ok: false,
      error: `Tipo de informe desconocido: ${typeInput}. Usá listReportTemplates.`,
    };
  }

  const data = await gatherReportData(scope, fieldId, zoneId);
  if (!data.ok) return data;

  const autoSections: Record<string, string> = {};
  for (const section of template.sections.filter((s) => s.fillMode === 'auto')) {
    autoSections[section.id] = buildAutoSection(
      section.id,
      template,
      data.snapshot,
      scope
    );
  }

  const aiSections = template.sections
    .filter((s) => s.fillMode === 'ai')
    .map((s) => ({
      id: s.id,
      title: s.title,
      promptHint: s.promptHint,
      maxWords: s.maxWords,
    }));

  const instructions =
    'Redactá SOLO las secciones marcadas fillMode=ai. No cambies encabezados ni formato. ' +
    'Luego llamá assembleReport con un objeto sectionContent { sectionId: texto }. ' +
    'Usá únicamente los datos del snapshot; no inventes fincas ni fechas.';

  return {
    ok: true,
    draft: {
      template,
      snapshot: data.snapshot,
      autoSections,
      aiSections,
      instructions,
    },
  };
}

function fallbackAiContent(
  sectionId: string,
  snapshot: ReportDraft['snapshot']
): string {
  switch (sectionId) {
    case 'situation-analysis':
      return snapshot.alerts.length
        ? `Se registran ${snapshot.alerts.length} alerta(s) activa(s). NDVI ${snapshot.ndvi?.toFixed(2) ?? 'N/D'} y riesgos ${snapshot.diseaseRisks.join(', ') || 'sin marcar'}. Validar en campo antes de aplicar.`
        : `Sin alertas críticas. NDVI ${snapshot.ndvi?.toFixed(2) ?? 'N/D'}. Mantener monitoreo semanal.`;
    case 'management-plan':
      return '- Inspección visual en las próximas 48 h.\n- Registrar hallazgos en bitácora.\n- Revisar ventana de aplicación según etiqueta y clima.';
    case 'trend-narrative':
      return snapshot.geodata?.trend
        ? `La serie histórica (${snapshot.geodata.historyWindow}) muestra tendencia **${snapshot.geodata.trend}** con ${snapshot.satelliteHistoryPoints} puntos satelitales.`
        : `Historial con ${snapshot.satelliteHistoryPoints} lecturas. Comparar con campaña anterior usando el Lab.`;
    case 'lessons':
      return '- Documentar manejo que funcionó.\n- Planificar monitoreo temprano en zonas de NDVI bajo.';
    case 'quality-assessment':
      return 'Evaluar impacto de alertas sanitarias sobre calidad de grano antes de cosecha. Registrar trazabilidad en bitácora.';
    case 'compliance-actions':
      return '- Mantener registro de aplicaciones.\n- Muestreo pre-cosecha si hay alertas abiertas.';
    case 'executive-summary':
      return `La finca ${snapshot.fieldName} presenta ${snapshot.topStressZones.length} zonas monitoreadas. Priorizar revisión donde NDVI < ${snapshot.topStressZones[0]?.ndvi.toFixed(2) ?? '0.4'}.`;
    case 'priority-zones':
      return snapshot.topStressZones
        .slice(0, 3)
        .map((z) => `- **${z.name}** (NDVI ${z.ndvi.toFixed(2)}): visita y validación en campo.`)
        .join('\n');
    case 'status-narrative':
      return `Zona ${snapshot.zoneName ?? 'principal'} con NDVI ${snapshot.ndvi?.toFixed(2) ?? 'N/D'} y salud ${snapshot.health ?? 'sin clasificar'}. Coherente con lecturas Copernicus recientes.`;
    case 'next-steps':
      return '- Revisar monitor en los próximos 3 días.\n- Actualizar bitácora si hay cambios.\n- Evaluar riego localizado si NDMI bajo.';
    default:
      return 'Sin contenido adicional generado.';
  }
}

export async function assembleReport(
  scope: AgentScope,
  typeInput: string,
  sectionContent: Record<string, string>,
  fieldId?: string,
  zoneId?: string
): Promise<{ ok: true; report: AssembledReport } | { ok: false; error: string }> {
  const prepared = await prepareReportDraft(scope, typeInput, fieldId, zoneId);
  if (!prepared.ok) return prepared;

  const { draft } = prepared;
  const merged: Record<string, string> = { ...draft.autoSections };

  for (const ai of draft.aiSections) {
    merged[ai.id] =
      sectionContent[ai.id]?.trim() ||
      fallbackAiContent(ai.id, draft.snapshot);
  }

  const markdownParts: string[] = [];
  for (const section of draft.template.sections) {
    const body = merged[section.id];
    if (body) markdownParts.push(body);
  }

  return {
    ok: true,
    report: {
      reportId: draft.snapshot.reportId,
      type: draft.template.type,
      title: draft.template.title,
      markdown: markdownParts.join('\n\n---\n\n'),
      sections: merged,
    },
  };
}

export async function buildQuickReport(
  scope: AgentScope,
  typeInput: string,
  fieldId?: string,
  zoneId?: string
): Promise<{ ok: true; report: AssembledReport } | { ok: false; error: string }> {
  return assembleReport(scope, typeInput, {}, fieldId, zoneId);
}

export async function buildFieldSummarySnapshot(scope: AgentScope): Promise<string> {
  const fields = await loadOrgFields(scope);
  const lines = fields.map(
    (f) =>
      `- ${f.name} (${f.area} ha, ${getCropLabelEs(f.crop)}, ${f.zones.length} zona(s))`
  );
  return ['Campos de la organización:', ...lines].join('\n');
}
