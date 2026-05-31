import { healthLabelEs, type HealthLevel } from '@/lib/design/tokens';

const DISEASE_NAME_ES: Record<string, string> = {
  Healthy: 'Saludable',
  Rust: 'Roya',
  'Powdery Mildew': 'Oídio',
  'Drought Stress': 'Estrés hídrico',
  'Gray Leaf Spot': 'Mancha gris de la hoja',
  'Asian Soybean Rust': 'Roya asiática de la soja',
  'Septoria Tritici': 'Septoria',
  'Stripe Rust': 'Roya amarilla',
};

const SEVERITY_ES: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

export function labelDiseaseName(name: string): string {
  return DISEASE_NAME_ES[name] ?? name;
}

export function labelObservationSeverity(severity: string): string {
  return SEVERITY_ES[severity.toLowerCase()] ?? severity;
}

export function labelOverallHealth(health: string): string {
  const level = health.toLowerCase() as HealthLevel;
  if (level in healthLabelEs) return healthLabelEs[level];
  return health;
}

export function isHealthyDiagnosis(primaryName?: string, probability?: number): boolean {
  if (!primaryName) return true;
  const n = primaryName.toLowerCase();
  if (n === 'healthy' || n === 'saludable') return true;
  return (probability ?? 0) < 50;
}
