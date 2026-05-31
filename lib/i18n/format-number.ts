/** Convierte valores de API/DB (string, null) a número finito. */
export function coerceNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Redondea a como máximo `decimals` cifras decimales. */
export function roundDecimal(value: unknown, decimals = 2): number | null {
  const n = coerceNumber(value);
  if (n == null) return null;
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

/** Formato legible: máximo `decimals` decimales (p. ej. 11.55, 2371.12). */
export function formatDecimal(value: unknown, decimals = 2): string {
  const rounded = roundDecimal(value, decimals);
  if (rounded == null) return '—';
  return rounded.toFixed(decimals);
}
