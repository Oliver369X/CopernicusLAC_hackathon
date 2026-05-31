/** Etiquetas de UI en español (alertas, severidad, tipos). */

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

export function labelAlertType(type: string): string {
  return alertTypeEs[type] ?? type;
}

export function labelAlertSeverity(severity: string): string {
  return alertSeverityEs[severity] ?? severity;
}
