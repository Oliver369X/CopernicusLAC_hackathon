import { readFileSync } from 'fs';
import { join } from 'path';
import { APP_NAME } from '@/lib/constants/app-brand';
import {
  AGENT_TOOLS,
  executeAgentTool,
  getFieldsSummary,
  getZoneSatelliteDetail,
} from '@/lib/agents/tools';
import type { AgentChatRequest, AgentChatResponse, AgentId } from '@/lib/agents/types';
import { buildSatelliteContext } from '@/lib/services/satellite-correlation';
import { buildMultiSensorNarrative } from '@/lib/services/fusion/multi-sensor-narrative';
import { getDbService } from '@/lib/db/get-service';
import { getFields } from '@/lib/data/fields';
import {
  getLatestSatelliteForZones,
  getSatelliteHistoryForZone,
  getLatestWeatherForField,
} from '@/lib/data/zone-satellite-metrics';
import { buildMonitorUrl, buildScienceUrl } from '@/lib/navigation/context-links';
import { isScienceCrop } from '@/lib/science/crops/registry';
import type { ScienceCropId } from '@/lib/science/types';
import { uniqueSources } from '@/lib/agents/unique-sources';

const SKILLS_DIR = join(process.cwd(), 'lib/agents/skills');

const AGENT_PROMPTS: Record<Exclude<AgentId, 'router'>, string> = {
  satellite: `Eres SatelliteAnalyst de ${APP_NAME}. Interpreta datos Sentinel-1/2/3, tendencias NDVI y grilla. Responde en español, conciso, citando números de las tools.`,
  advisor: `Eres FieldAdvisor de ${APP_NAME}. Recomienda acciones agronómicas por zona (riego, fungicida, monitoreo). Usa alertas y métricas reales.`,
  guide: `Eres DemoGuide de ${APP_NAME}. Ayuda al jurado a usar la plataforma, demo 3 min y credenciales. Usa getPlatformGuide y listDemoCredentials.`,
  interpreter: `Eres FieldInterpreter de Aura. Explicá métricas en lenguaje claro para productores: qué significa cada número, si está bien o mal, y qué heurística aplicar. Usá explainZoneMetrics y getZoneSatelliteDetail.`,
};

function readSkill(name: string): string {
  try {
    return readFileSync(join(SKILLS_DIR, name), 'utf-8');
  } catch {
    return '';
  }
}

function classifyIntent(message: string): AgentId {
  const m = message.toLowerCase();
  if (
    /demo|credencial|login|gu[ií]a|ruta|monitor|c[oó]mo|plataforma|hackathon/.test(m)
  ) {
    return 'guide';
  }
  if (/qu[eé] hago|recomend|riego|fungicida|alerta|accion|campo/.test(m)) {
    return 'advisor';
  }
  if (/explic|significa|entender|comprens|métrica|metrica|ndvi/.test(m)) {
    return 'interpreter';
  }
  return 'satellite';
}

async function ruleBasedReply(
  req: AgentChatRequest,
  agent: AgentId
): Promise<AgentChatResponse> {
  const summary = await getFieldsSummary();
  const sources = uniqueSources([
    summary.source === 'satellite_readings' ? 'Copernicus CDSE' : 'seed',
  ]);

  if (agent === 'guide') {
    const creds = await executeAgentTool('listDemoCredentials', {});
    const demoSkill = readSkill('demo-narrative.md');
    return {
      reply: `${APP_NAME} — guía demo:\n\n${demoSkill.slice(0, 800)}\n\nCredenciales: ${JSON.stringify(creds)}`,
      agentUsed: 'guide',
      sources: ['Aura Agro skills'],
      suggestedActions: ['Abrir /monitor', 'Preguntar resumen satelital', 'Ir a /science/soybean'],
    };
  }

  if (agent === 'interpreter') {
    const zoneIdInterp = req.zoneId ?? summary.topStressZones?.[0]?.zoneId;
    if (zoneIdInterp) {
      const narrative = await executeAgentTool('explainZoneMetrics', {
        zoneId: zoneIdInterp,
      });
      return {
        reply: JSON.stringify(narrative, null, 2),
        agentUsed: 'interpreter',
        sources,
        suggestedActions: ['Abrir /monitor', 'Ver narrativa en la zona'],
      };
    }
  }

  if (agent === 'advisor') {
    const alerts = await executeAgentTool('getActiveAlerts', {
      fieldId: req.fieldId,
    });
    const stress = summary.topStressZones?.[0];
    const reply = stress
      ? `Zona con mayor estrés: ${stress.name} (NDVI ${stress.ndvi.toFixed(2)}, humedad ${stress.soilMoisture}%). Revisá alertas activas y considerá riego localizado. Alertas: ${JSON.stringify(alerts).slice(0, 400)}`
      : `Hay ${summary.fieldCount} campos. Revisá alertas activas en /alerts.`;
    return {
      reply,
      agentUsed: 'advisor',
      sources,
      suggestedActions: ['Ver /alerts', 'Abrir zone-sj-n-4 en monitor'],
    };
  }

  const zoneId = req.zoneId ?? summary.topStressZones?.[0]?.zoneId;
  if (zoneId) {
    const detail = await getZoneSatelliteDetail(zoneId);
    const service = await getDbService();
    const fields = await getFields();
    const zone = fields.flatMap((f) => f.zones).find((z) => z.id === zoneId);
    const field = fields.find((f) => f.id === zone?.fieldId);
    if (zone && field && service) {
      const satMap = await getLatestSatelliteForZones(service, [zoneId]);
      const history = await getSatelliteHistoryForZone(service, zoneId, 14);
      const weather = await getLatestWeatherForField(service, field.id);
      const ctx = buildSatelliteContext(
        satMap.get(zoneId) ?? null,
        weather,
        history,
        {
          ndvi: zone.ndviAverage,
          ndmi: zone.ndmiAverage,
          temp: zone.temperatureAverage,
          soil: zone.soilMoistureAverage,
        }
      );
      const narrative = buildMultiSensorNarrative(ctx);
      const monitorLink = buildMonitorUrl({
        fieldId: field.id,
        zoneId: zone.id,
        crop: field.crop,
      });
      const scienceLink = isScienceCrop(field.crop)
        ? buildScienceUrl({
            fieldId: field.id,
            zoneId: zone.id,
            crop: field.crop as ScienceCropId,
            tab: 'lab',
          })
        : '/science';
      return {
        reply: `Resumen satelital (${zone.name}): ${narrative}\n\nDetalle: ${JSON.stringify(detail.latest).slice(0, 300)}\n\n[Ver en monitor](${monitorLink}) · [Lab ${field.crop}](${scienceLink})`,
        agentUsed: 'satellite',
        sources,
        suggestedActions: ['Comparar zone-sj-n-4 vs zone-sj-n-5', 'Ver grilla en /monitor'],
      };
    }
  }

  const monitorLink = buildMonitorUrl({ fieldId: 'field-sj-norte' });
  const scienceLink = buildScienceUrl({
    fieldId: 'field-sj-norte',
    crop: 'soybean',
    tab: 'lab',
  });
  return {
    reply: `Resumen portfolio: ${summary.fieldCount} campos, ${summary.satelliteZones} zonas con Copernicus. NDVI por campo: ${summary.fields.map((f) => `${f.field}: ${f.ndvi.toFixed(2)}`).join('; ')}\n\n[Ver en monitor](${monitorLink}) · [Lab soja](${scienceLink})`,
    agentUsed: 'satellite',
    sources,
    suggestedActions: ['Zona con más estrés', 'Guía demo 3 min'],
  };
}

interface MistralMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
  name?: string;
}

async function callMistral(
  agent: Exclude<AgentId, 'router'>,
  messages: MistralMessage[]
): Promise<{ content: string; toolCalls: Array<{ id: string; name: string; args: Record<string, unknown> }> }> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error('No MISTRAL_API_KEY');

  const tools = AGENT_TOOLS.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.MISTRAL_AGENT_MODEL ?? 'mistral-small-latest',
      messages,
      tools,
      tool_choice: 'auto',
      max_tokens: 1200,
    }),
  });

  if (!res.ok) throw new Error(`Mistral ${res.status}`);

  const data = (await res.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
        tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
      };
    }>;
  };

  const message = data.choices?.[0]?.message;
  const toolCalls =
    message?.tool_calls?.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      args: JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>,
    })) ?? [];

  return { content: message?.content ?? '', toolCalls };
}

export async function runAgentChat(req: AgentChatRequest): Promise<AgentChatResponse> {
  const agent = classifyIntent(req.message);
  if (agent === 'router') {
    return ruleBasedReply(req, 'satellite');
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return ruleBasedReply(req, agent);
  }

  const skillContext =
    agent === 'guide'
      ? readSkill('demo-narrative.md')
      : agent === 'satellite'
        ? readSkill('monitor-copernicus.md')
        : '';

  const systemPrompt = `${AGENT_PROMPTS[agent]}\n\nContexto:\nfieldId=${req.fieldId ?? 'any'}\nzoneId=${req.zoneId ?? 'any'}\n${req.screenContext ? `Pantalla: ${req.screenContext}\n` : ''}\n${skillContext}`;

  const userContent = req.screenContext
    ? `[Contexto pantalla: ${req.screenContext}]\n\n${req.message}`
    : req.message;

  const messages: MistralMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ];

  const sources: string[] = ['Mistral AI'];
  let iterations = 0;

  while (iterations < 4) {
    iterations++;
    const { content, toolCalls } = await callMistral(agent, messages);

    if (!toolCalls.length) {
      return {
        reply: content || 'Sin respuesta del modelo.',
        agentUsed: agent,
        sources: uniqueSources([...sources, 'Copernicus CDSE']),
        suggestedActions: ['Resumen satelital hoy', 'Guía demo 3 min'],
      };
    }

    messages.push({
      role: 'assistant',
      content: content || '',
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        function: { name: tc.name, arguments: JSON.stringify(tc.args) },
      })),
    });

    for (const tc of toolCalls) {
      const result = await executeAgentTool(tc.name, tc.args);
      if (tc.name === 'getFieldsSummary' || tc.name === 'getZoneSatelliteDetail') {
        sources.push('Copernicus CDSE');
      }
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        name: tc.name,
        content: JSON.stringify(result),
      });
    }
  }

  const fallback = await ruleBasedReply(req, agent);
  return { ...fallback, sources: uniqueSources(fallback.sources) };
}

export async function buildAutoBriefing(): Promise<string> {
  const summary = await getFieldsSummary();
  if (summary.satelliteZones === 0) {
    return 'Aún no hay lecturas Copernicus en la base. Ejecutá cron:satellite antes de la demo.';
  }
  const stress = summary.topStressZones?.[0];
  if (!stress) return `Portfolio: ${summary.fieldCount} campos monitoreados.`;
  return `Briefing: ${summary.satelliteZones} zonas con datos Copernicus. Mayor estrés: ${stress.name} (NDVI ${stress.ndvi.toFixed(2)}).`;
}
