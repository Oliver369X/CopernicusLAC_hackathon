import { healthLabelEs, type HealthLevel } from '@/lib/design/tokens';
import { resolveDiseaseKnowledge } from '@/lib/diagnostics/disease-knowledge';

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
  moderate: 'Media',
  moderada: 'Media',
  high: 'Alta',
  alta: 'Alta',
  severe: 'Alta',
  severa: 'Alta',
  critical: 'Crítica',
  critica: 'Crítica',
  crítica: 'Crítica',
};

export function labelDiseaseName(name: string, crop?: string): string {
  const fromKb = resolveDiseaseKnowledge(name, crop)?.nameEs;
  if (fromKb) return fromKb;
  return DISEASE_NAME_ES[name] ?? name;
}

export function labelObservationSeverity(severity: string | undefined | null): string {
  if (!severity?.trim()) return 'Sin clasificar';
  return SEVERITY_ES[severity.toLowerCase()] ?? severity;
}

export function labelOverallHealth(health: string | undefined | null): string {
  if (!health?.trim()) return 'Salud por evaluar';
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
