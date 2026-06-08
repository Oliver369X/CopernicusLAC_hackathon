/** Etiquetas de UI en español (alertas, severidad, tipos). */

import {
  labelAlertSeverityPlain,
  labelAlertTypePlain,
} from '@/lib/i18n/plain-labels';

export const alertTypeEs: Record<string, string> = {
  disease: 'Enfermedad',
  threshold: 'Umbral',
  predictive: 'Predictiva',
  anomaly: 'Anomalía',
};

export const alertSeverityEs: Record<string, string> = {
  critical: 'Crítica',
  warning: 'Advertencia',
  info: 'Informativa',
};

export function labelAlertType(type: string, plain = false): string {
  if (plain) return labelAlertTypePlain(type);
  return alertTypeEs[type] ?? type;
}

export function labelAlertSeverity(severity: string, plain = false): string {
  if (plain) return labelAlertSeverityPlain(severity);
  return alertSeverityEs[severity] ?? severity;
}
