import { APP_NAME, APP_TAGLINE } from '@/lib/constants/app-brand';
import { healthLabelEs, type HealthLevel } from '@/lib/design/tokens';
import type { CorrelationAnalysis } from '@/lib/mock-data/vision-analyzer';
import type { CropType } from '@/lib/mock-data/crops';
import { CROP_PROFILES } from '@/lib/mock-data/crops';
import { resolveDiseaseKnowledge } from '@/lib/diagnostics/disease-knowledge';
import type {
  DiseaseFindingReport,
  SpecialistDiagnosticReport,
} from '@/lib/diagnostics/types';
import { labelObservationSeverity } from '@/lib/i18n/observation-labels';

const CROP_LABELS: Record<string, string> = {
  soybean: 'Soja',
  soy: 'Soja',
  corn: 'Maíz',
  maize: 'Maíz',
  wheat: 'Trigo',
  cotton: 'Algodón',
  sunflower: 'Girasol',
};

export interface BuildReportContext {
  observationId?: string;
  orgName?: string;
  fieldName?: string;
  zoneName?: string;
  crop?: string;
  coordinates?: { lat: number; lng: number };
  notes?: string;
  disclaimer?: string;
  satelliteContext?: {
    ndvi?: number;
    ndmi?: number;
    ndre?: number | null;
    s3Lst?: number | null;
    s1MoistureIndex?: number | null;
    stressPattern?: string;
    source?: string;
  };
}

function normalizeCrop(crop?: string): CropType {
  const c = (crop ?? 'soybean').toLowerCase();
  if (c === 'soy' || c === 'soja') return 'soybean';
  if (c === 'maize' || c === 'maiz' || c === 'maíz') return 'corn';
  if (c === 'trigo') return 'wheat';
  if (c in CROP_PROFILES) return c as CropType;
  return 'soybean';
}

function buildFindingNarrative(
  knowledge: DiseaseFindingReport['knowledge'],
  confidencePct: number,
  severityLabel: string,
  ndvi: number | null,
  ndmi: number | null
): string {
  if (!knowledge) {
    return `Hallazgo con confianza ${confidencePct}% y severidad ${severityLabel}. Se recomienda validación presencial por agrónomo.`;
  }

  const parts = [
    `${knowledge.nameEs} (${knowledge.scientificName}). Agente: ${knowledge.causalAgent}.`,
    `Confianza del modelo de visión: ${confidencePct}%. Severidad estimada: ${severityLabel}.`,
    knowledge.economicThreshold,
  ];

  if (ndvi != null && knowledge.ndviAlertBelow != null && ndvi < knowledge.ndviAlertBelow) {
    parts.push(
      `NDVI ${ndvi.toFixed(2)} por debajo del umbral de alerta (${knowledge.ndviAlertBelow}) — coherente con el hallazgo.`
    );
  }
  if (ndmi != null && knowledge.ndmiAlertBelow != null && ndmi < knowledge.ndmiAlertBelow) {
    parts.push(
      `NDMI ${ndmi.toFixed(2)} sugiere estrés hídrico o foliar asociado.`
    );
  }

  parts.push(knowledge.satelliteInterpretation);
  return parts.join(' ');
}

function interpretSatellite(
  ndvi: number | null,
  ndmi: number | null,
  crop: CropType,
  health: HealthLevel
): string {
  const profile = CROP_PROFILES[crop];
  const [ndviMin, ndviMax] = profile.ndviRange;

  if (ndvi == null && ndmi == null) {
    return 'Sin datos satelitales en este muestreo; el diagnóstico se basa en visión de campo.';
  }

  const lines: string[] = [];
  if (ndvi != null) {
    if (ndvi < ndviMin + 0.1) {
      lines.push(
        `NDVI ${ndvi.toFixed(2)} indica estrés vegetativo significativo (rango esperado ${ndviMin}–${ndviMax} para ${CROP_LABELS[crop] ?? crop}).`
      );
    } else if (ndvi > ndviMax - 0.05) {
      lines.push(`NDVI ${ndvi.toFixed(2)} dentro de dosel alto para el cultivo.`);
    } else {
      lines.push(`NDVI ${ndvi.toFixed(2)} en rango intermedio; correlacionar con fenología.`);
    }
  }
  if (ndmi != null) {
    if (ndmi < 0.25) {
      lines.push(`NDMI ${ndmi.toFixed(2)} — déficit hídrico o baja turgencia foliar.`);
    } else if (ndmi > 0.55) {
      lines.push(`NDMI ${ndmi.toFixed(2)} — buena reserva de humedad en vegetación.`);
    } else {
      lines.push(`NDMI ${ndmi.toFixed(2)} — humedura foliar moderada.`);
    }
  }

  lines.push(
    `Estado visual integrado: ${healthLabelEs[health]}. Validar en campo antes de aplicar fitosanitarios.`
  );
  return lines.join(' ');
}

function buildExecutiveSummary(
  analysis: CorrelationAnalysis,
  cropLabel: string,
  fieldName: string,
  zoneName: string,
  findings: DiseaseFindingReport[]
): string {
  const health = healthLabelEs[analysis.overallHealth];
  const primary =
    findings.find((f) => f.knowledge?.id !== 'healthy') ?? findings[0];

  if (!primary || primary.knowledge?.id === 'healthy') {
    return (
      `Informe de ${cropLabel} — ${fieldName}, ${zoneName}. ` +
      `Evaluación integral: ${health} (índice ${analysis.healthScore}/100, confianza ${Math.round(analysis.confidence)}%). ` +
      `No se detectaron patologías prioritarias. Mantener monitoreo preventivo y correlación con índices Copernicus.`
    );
  }

  return (
    `Informe de ${cropLabel} — ${fieldName}, ${zoneName}. ` +
    `Estado: ${health} (riesgo ${analysis.riskScore}/100). ` +
    `Hallazgo principal: ${primary.nameEs} (confianza ${primary.confidencePct}%, severidad ${primary.severityLabel}). ` +
    `Se recomienda plan de manejo integrado inmediato y seguimiento satelital en 7 días.`
  );
}

export function buildSpecialistReport(
  analysis: CorrelationAnalysis,
  context: BuildReportContext = {}
): SpecialistDiagnosticReport {
  const crop = normalizeCrop(context.crop);
  const cropLabel = CROP_LABELS[crop] ?? context.crop ?? 'Cultivo';
  const ndvi = context.satelliteContext?.ndvi ?? null;
  const ndmi = context.satelliteContext?.ndmi ?? null;

  const findings: DiseaseFindingReport[] =
    analysis.detectedDiseases.length > 0
      ? analysis.detectedDiseases.map((d) => {
          const knowledge = resolveDiseaseKnowledge(d.disease, crop);
          const confidencePct = Math.round(
            (d.confidence <= 1 ? d.confidence * 100 : d.confidence)
          );
          const severityLabel = labelObservationSeverity(d.severity);
          return {
            detectionName: d.disease,
            nameEs: knowledge?.nameEs ?? d.disease,
            confidencePct,
            severityLabel,
            affectedAreaPct: Math.round(d.affectedArea ?? 0),
            description: d.description,
            knowledge,
            specialistNarrative: buildFindingNarrative(
              knowledge,
              confidencePct,
              severityLabel,
              ndvi,
              ndmi
            ),
            recommendations: [
              ...d.recommendations,
              ...(knowledge?.immediateActions ?? []),
            ].filter((v, i, a) => a.indexOf(v) === i),
          };
        })
      : [
          {
            detectionName: 'Healthy',
            nameEs: 'Sin patología detectable',
            confidencePct: Math.round(analysis.confidence),
            severityLabel: 'N/A',
            affectedAreaPct: 0,
            description: 'El análisis de visión no identificó lesiones compatibles con patologías priorizadas.',
            knowledge: resolveDiseaseKnowledge('healthy', crop),
            specialistNarrative: buildFindingNarrative(
              resolveDiseaseKnowledge('healthy', crop),
              Math.round(analysis.confidence),
              'N/A',
              ndvi,
              ndmi
            ),
            recommendations: analysis.combinedRecommendations,
          },
        ];

  const immediate = new Set<string>();
  const shortTerm = new Set<string>();
  const preventive = new Set<string>();
  const monitoring = new Set<string>();

  for (const f of findings) {
    f.knowledge?.immediateActions.forEach((a) => immediate.add(a));
    f.knowledge?.shortTermManagement.forEach((a) => shortTerm.add(a));
    f.knowledge?.preventiveMeasures.forEach((a) => preventive.add(a));
    if (f.knowledge?.monitoringInterval) monitoring.add(f.knowledge.monitoringInterval);
  }
  const satelliteOnly = /promedio satelital|NDVI de zona|patrón:|LST elevada|Radar S1/i;
  analysis.combinedRecommendations.forEach((r) => {
    if (satelliteOnly.test(r)) return;
    shortTerm.add(r);
  });

  return {
    reportId: `AURA-${context.observationId ?? Date.now()}`,
    generatedAt: new Date().toISOString(),
    orgName: context.orgName ?? APP_NAME,
    fieldName: context.fieldName ?? 'Lote de campo',
    zoneName: context.zoneName ?? 'Zona de manejo',
    crop,
    cropLabel,
    observationId: context.observationId,
    coordinates: context.coordinates,
    notes: context.notes,
    overallHealth: analysis.overallHealth,
    healthScore: analysis.healthScore,
    confidence: analysis.confidence,
    riskScore: analysis.riskScore,
    executiveSummary: buildExecutiveSummary(
      analysis,
      cropLabel,
      context.fieldName ?? 'Lote',
      context.zoneName ?? 'Zona',
      findings
    ),
    methodology: [
      `Análisis de imagen con visión computacional (${APP_NAME}).`,
      'Correlación con índices espectrales Copernicus (NDVI, NDMI, NDRE, LST S3, humedad S1).',
      'Enriquecimiento con base de conocimiento fitosanitario regional (manejo integrado).',
      APP_TAGLINE,
    ],
    visualAssessment: {
      leafColor: analysis.leafCondition?.color ?? '—',
      spotting: analysis.leafCondition?.spotting ?? false,
      wilt: analysis.leafCondition?.wilt ?? false,
      necrosis: analysis.leafCondition?.necrosis ?? false,
      moistureStatus: analysis.moistureStatus ?? '—',
      nutritionStatus: analysis.nutritionStatus ?? '—',
    },
    satellite: {
      ndvi,
      ndmi,
      ndre: context.satelliteContext?.ndre ?? null,
      lst: context.satelliteContext?.s3Lst ?? null,
      s1Moisture: context.satelliteContext?.s1MoistureIndex ?? null,
      stressPattern: context.satelliteContext?.stressPattern ?? null,
      source: context.satelliteContext?.source ?? 'Copernicus Data Space Ecosystem',
      insights: analysis.satelliteInsights,
      interpretation: interpretSatellite(ndvi, ndmi, crop, analysis.overallHealth),
    },
    findings,
    managementPlan: {
      immediate: [...immediate],
      shortTerm: [...shortTerm],
      preventive: [...preventive],
      monitoring: [...monitoring],
    },
    combinedRecommendations: analysis.combinedRecommendations,
    disclaimer:
      context.disclaimer ??
      'Este informe es orientativo, generado con IA y datos satelitales. No reemplaza la inspección presencial de un ingeniero agrónomo matriculado. Verificar etiquetas de productos y normativa local antes de aplicar fitosanitarios.',
  };
}
