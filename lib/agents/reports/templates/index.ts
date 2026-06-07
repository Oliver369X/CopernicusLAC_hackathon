import type { AgentReportType, ReportTemplate } from '@/lib/agents/reports/types';

const DISEASE_SITUATION: ReportTemplate = {
  type: 'disease-situation',
  title: 'Informe de situación fitosanitaria',
  description: 'Enfermedades, plagas y riesgos activos con contexto satelital',
  sections: [
    {
      id: 'header',
      title: 'Encabezado',
      fillMode: 'auto',
      promptHint: 'Metadatos del informe',
    },
    {
      id: 'metrics',
      title: 'Indicadores satelitales',
      fillMode: 'auto',
      promptHint: 'NDVI, NDMI, salud y riesgos detectados',
    },
    {
      id: 'alerts-summary',
      title: 'Alertas activas',
      fillMode: 'auto',
      promptHint: 'Listado de alertas no resueltas',
    },
    {
      id: 'situation-analysis',
      title: 'Análisis de la situación',
      fillMode: 'ai',
      promptHint:
        'Interpretá alertas, riesgos en zona y bitácora. Relacioná con NDVI/NDMI. Español claro para productor.',
      maxWords: 220,
    },
    {
      id: 'management-plan',
      title: 'Plan de manejo recomendado',
      fillMode: 'ai',
      promptHint:
        'Acciones inmediatas, monitoreo y preventivas. Bullets breves. No inventar productos comerciales.',
      maxWords: 180,
    },
    {
      id: 'disclaimer',
      title: 'Aviso legal',
      fillMode: 'auto',
      promptHint: 'Disclaimer estándar Aura',
    },
  ],
};

const HISTORICAL_3Y: ReportTemplate = {
  type: 'historical-3y',
  title: 'Informe histórico (hasta 3 años)',
  description: 'Tendencias NDVI, campañas y evolución de la parcela',
  sections: [
    {
      id: 'header',
      title: 'Encabezado',
      fillMode: 'auto',
      promptHint: 'Metadatos e ventana histórica',
    },
    {
      id: 'metrics',
      title: 'Estado actual',
      fillMode: 'auto',
      promptHint: 'Métricas actuales y puntos de serie',
    },
    {
      id: 'geodata-summary',
      title: 'Serie histórica',
      fillMode: 'auto',
      promptHint: 'Resumen geo-data si disponible',
    },
    {
      id: 'observations-log',
      title: 'Bitácora de campo',
      fillMode: 'auto',
      promptHint: 'Observaciones recientes',
    },
    {
      id: 'trend-narrative',
      title: 'Narrativa de tendencias',
      fillMode: 'ai',
      promptHint:
        'Compará campañas, sequías, recuperaciones. Citá fechas de bitácora si existen. Hasta 3 años.',
      maxWords: 280,
    },
    {
      id: 'lessons',
      title: 'Lecciones y próxima campaña',
      fillMode: 'ai',
      promptHint: 'Qué repetir, qué evitar, 2-4 bullets concretos.',
      maxWords: 150,
    },
    {
      id: 'disclaimer',
      title: 'Aviso legal',
      fillMode: 'auto',
      promptHint: 'Disclaimer estándar Aura',
    },
  ],
};

const FOOD_SAFETY: ReportTemplate = {
  type: 'food-safety',
  title: 'Informe de seguridad alimentaria',
  description: 'Sanidad vegetal, trazabilidad y calidad de grano',
  sections: [
    {
      id: 'header',
      title: 'Encabezado',
      fillMode: 'auto',
      promptHint: 'Metadatos del informe',
    },
    {
      id: 'metrics',
      title: 'Indicadores de cultivo',
      fillMode: 'auto',
      promptHint: 'Salud, NDVI, riesgos',
    },
    {
      id: 'alerts-summary',
      title: 'Alertas sanitarias',
      fillMode: 'auto',
      promptHint: 'Alertas relevantes a calidad/inocuidad',
    },
    {
      id: 'traceability',
      title: 'Trazabilidad y bitácora',
      fillMode: 'auto',
      promptHint: 'Observaciones de campo',
    },
    {
      id: 'quality-assessment',
      title: 'Evaluación de calidad e inocuidad',
      fillMode: 'ai',
      promptHint:
        'Impacto en calidad de grano, residuos, cosecha segura. Lenguaje apto para cooperativa o productora familiar.',
      maxWords: 220,
    },
    {
      id: 'compliance-actions',
      title: 'Acciones de cumplimiento',
      fillMode: 'ai',
      promptHint: 'Monitoreo, muestreo, registro. Sin asesoramiento legal.',
      maxWords: 160,
    },
    {
      id: 'disclaimer',
      title: 'Aviso legal',
      fillMode: 'auto',
      promptHint: 'Disclaimer estándar Aura',
    },
  ],
};

const FIELD_SUMMARY: ReportTemplate = {
  type: 'field-summary',
  title: 'Informe ejecutivo de finca',
  description: 'Panorama general de campos y zonas de la organización',
  sections: [
    {
      id: 'header',
      title: 'Encabezado',
      fillMode: 'auto',
      promptHint: 'Organización y fecha',
    },
    {
      id: 'portfolio',
      title: 'Portfolio de campos',
      fillMode: 'auto',
      promptHint: 'Resumen de campos y zonas con estrés',
    },
    {
      id: 'executive-summary',
      title: 'Resumen ejecutivo',
      fillMode: 'ai',
      promptHint: 'Estado general, prioridades de la semana, 1 párrafo + bullets.',
      maxWords: 200,
    },
    {
      id: 'priority-zones',
      title: 'Zonas prioritarias',
      fillMode: 'ai',
      promptHint: 'Top 3 zonas a revisar con NDVI y acción sugerida.',
      maxWords: 180,
    },
    {
      id: 'disclaimer',
      title: 'Aviso legal',
      fillMode: 'auto',
      promptHint: 'Disclaimer estándar Aura',
    },
  ],
};

const ZONE_STATUS: ReportTemplate = {
  type: 'zone-status',
  title: 'Informe de estado de zona',
  description: 'Estado agronómico puntual de una zona/subparcela',
  sections: [
    {
      id: 'header',
      title: 'Encabezado',
      fillMode: 'auto',
      promptHint: 'Campo, zona, cultivo',
    },
    {
      id: 'metrics',
      title: 'Métricas actuales',
      fillMode: 'auto',
      promptHint: 'NDVI, NDMI, humedad, salud',
    },
    {
      id: 'satellite-context',
      title: 'Contexto satelital',
      fillMode: 'auto',
      promptHint: 'Historial reciente y fuentes',
    },
    {
      id: 'status-narrative',
      title: 'Estado y diagnóstico agronómico',
      fillMode: 'ai',
      promptHint: 'Qué está pasando en la zona, coherencia satélite + campo.',
      maxWords: 200,
    },
    {
      id: 'next-steps',
      title: 'Próximos pasos',
      fillMode: 'ai',
      promptHint: '3-5 acciones concretas para los próximos 7 días.',
      maxWords: 120,
    },
    {
      id: 'disclaimer',
      title: 'Aviso legal',
      fillMode: 'auto',
      promptHint: 'Disclaimer estándar Aura',
    },
  ],
};

export const REPORT_TEMPLATES: Record<AgentReportType, ReportTemplate> = {
  'disease-situation': DISEASE_SITUATION,
  'historical-3y': HISTORICAL_3Y,
  'food-safety': FOOD_SAFETY,
  'field-summary': FIELD_SUMMARY,
  'zone-status': ZONE_STATUS,
};

export const REPORT_TYPE_LABELS: Record<AgentReportType, string> = {
  'disease-situation': 'Situación fitosanitaria',
  'historical-3y': 'Histórico 3 años',
  'food-safety': 'Seguridad alimentaria',
  'field-summary': 'Resumen de finca',
  'zone-status': 'Estado de zona',
};

export function listReportTemplateSummaries() {
  return Object.values(REPORT_TEMPLATES).map((t) => ({
    type: t.type,
    title: t.title,
    description: t.description,
    aiSectionIds: t.sections.filter((s) => s.fillMode === 'ai').map((s) => s.id),
  }));
}

export function resolveReportType(input: string): AgentReportType | null {
  const normalized = input.trim().toLowerCase();
  if (normalized in REPORT_TEMPLATES) {
    return normalized as AgentReportType;
  }
  const aliases: Record<string, AgentReportType> = {
    enfermedad: 'disease-situation',
    enfermedades: 'disease-situation',
    fitosanitario: 'disease-situation',
    plaga: 'disease-situation',
    historico: 'historical-3y',
    historial: 'historical-3y',
    '3y': 'historical-3y',
    '3-años': 'historical-3y',
    seguridad: 'food-safety',
    inocuidad: 'food-safety',
    trazabilidad: 'food-safety',
    ejecutivo: 'field-summary',
    finca: 'field-summary',
    zona: 'zone-status',
    subparcela: 'zone-status',
  };
  return aliases[normalized] ?? null;
}
