import type { HealthLevel } from '@/lib/design/tokens';

/** Etiquetas en lenguaje productor — sin siglas satelitales. */

export const PLAIN_METRIC_LABELS: Record<string, string> = {
  ndvi: 'Verdor del cultivo',
  ndmi: 'Humedad de la planta',
  ndre: 'Salud de la hoja',
  sarMoisture: 'Humedad del suelo',
  sar: 'Humedad del suelo',
  hotspots: 'Incendios cerca (7 días)',
  trend: 'Tendencia reciente',
  confidence: 'Confianza del dato',
  fusionScore: 'Estado general',
  health: 'Estado general',
};

export const PLAIN_HEALTH_LABELS: Record<HealthLevel, string> = {
  excellent: 'Muy bien',
  good: 'Bien',
  warning: 'Conviene revisar',
  critical: 'Urgente',
};

export const PLAIN_SPATIAL_LABELS = {
  field: 'Parcela',
  fields: 'Parcelas',
  zone: 'Parte de la parcela',
  zones: 'Partes de la parcela',
} as const;

export const PLAIN_NAV_LABELS = {
  inicio: 'Inicio',
  mapa: 'Mapa de mi parcela',
  cultivo: 'Cómo va mi cultivo',
  alertas: 'Alertas',
  fotos: 'Fotos en campo',
  parcelas: 'Parcelas',
} as const;

export const PLAIN_ALERT_TYPE_LABELS: Record<string, string> = {
  disease: 'Posible enfermedad',
  threshold: 'Límite de alerta',
  predictive: 'Aviso anticipado',
  anomaly: 'Algo cambió en tu parcela',
  hotspot_stress: 'Zona que necesita revisión',
  fire: 'Incendio cerca',
  weather: 'Clima',
};

export const PLAIN_ALERT_SEVERITY_LABELS: Record<string, string> = {
  critical: 'Importante',
  warning: 'Atención',
  info: 'Informativo',
};

export const PLAIN_ALERT_FILTER_LABELS = {
  all: 'Todas',
  unresolved: 'Sin leer',
  critical: 'Importantes',
} as const;

export function labelMetricPlain(metricId: string, fallback?: string): string {
  const key = metricId.toLowerCase();
  return PLAIN_METRIC_LABELS[key] ?? fallback ?? metricId;
}

export function labelHealthPlain(level: HealthLevel | string | null | undefined): string {
  if (!level) return 'Sin datos aún';
  const normalized = level as HealthLevel;
  return PLAIN_HEALTH_LABELS[normalized] ?? String(level);
}

export function labelAlertTypePlain(type: string): string {
  return PLAIN_ALERT_TYPE_LABELS[type] ?? 'Aviso de tu parcela';
}

export function labelAlertSeverityPlain(severity: string): string {
  return PLAIN_ALERT_SEVERITY_LABELS[severity] ?? severity;
}

export function formatSatelliteReadPlain(dateIso: string | null | undefined): string {
  if (!dateIso) return 'Aún no hay lectura del satélite';
  try {
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return 'Aún no hay lectura del satélite';
    return `El satélite miró tu parcela el ${d.toLocaleDateString('es-BO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })}`;
  } catch {
    return 'Aún no hay lectura del satélite';
  }
}

export function cropStatusSentence(
  cropLabel: string,
  health: HealthLevel | string | null | undefined
): string {
  const state = labelHealthPlain(health);
  if (state === 'Sin datos aún') {
    return `Tu ${cropLabel.toLowerCase()} — esperando la primera lectura`;
  }
  if (state === 'Urgente' || state === 'Conviene revisar') {
    return `Tu ${cropLabel.toLowerCase()} — ${state.toLowerCase()}`;
  }
  return `Tu ${cropLabel.toLowerCase()} está ${state.toLowerCase()}`;
}
