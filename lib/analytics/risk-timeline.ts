/** Serie de riesgo determinista (evita Math.random y hydration mismatch). */

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

const RISK_BY_RANGE: Record<'week' | 'month' | 'season', number[]> = {
  week: [38, 42, 40, 36, 35, 32, 39],
  month: [42, 45, 41, 38, 40, 36, 39],
  season: [44, 48, 43, 40, 42, 38, 41],
};

const FIELDS_AT_RISK: Record<'week' | 'month' | 'season', number[]> = {
  week: [4, 5, 4, 3, 3, 2, 4],
  month: [4, 5, 5, 4, 4, 3, 4],
  season: [5, 6, 5, 4, 5, 4, 5],
};

export function buildRiskTimeline(range: 'week' | 'month' | 'season') {
  const riesgos = RISK_BY_RANGE[range];
  const campos = FIELDS_AT_RISK[range];
  return DAY_LABELS.map((date, i) => ({
    date,
    riesgo: riesgos[i] ?? 40,
    campos: campos[i] ?? 4,
  }));
}
