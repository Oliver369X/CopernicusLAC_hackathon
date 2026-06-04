import type { ObservationCardData } from '@/components/field/observation-history-card';

/** Normaliza vision_result de API/DB (puede venir sin `diseases`). */
export function normalizeDiagnosis(
  raw: unknown
): ObservationCardData['diagnosis'] | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const rawDiseases = Array.isArray(o.diseases) ? o.diseases : [];
  const diseases = rawDiseases
    .map((d) => {
      if (!d || typeof d !== 'object') return null;
      const item = d as Record<string, unknown>;
      const name = String(item.name ?? item.label ?? 'Sin clasificar');
      const probability = Number(item.probability ?? item.confidence ?? 0);
      return { name, probability: Number.isFinite(probability) ? probability : 0 };
    })
    .filter((d): d is { name: string; probability: number } => d != null);

  const confidence = Number(o.confidence ?? 0);
  const severity = String(o.severity ?? 'low');
  if (!diseases.length) return undefined;

  return {
    diseases,
    confidence: Number.isFinite(confidence) ? confidence : 0,
    severity,
  };
}
