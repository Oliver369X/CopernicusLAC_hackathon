import type { CSSProperties } from 'react';

/**
 * Design tokens for JS (Recharts, inline styles).
 * Keep in sync with app/globals.css — update both when changing the palette.
 */

/** @sync app/globals.css */
export const brandColors = {
  auraGreen: '#16B57D',
  auraOrange: '#F2A021',
  auraNight: '#0A0A0F',
  auraSlate: '#70757F',
  /** @deprecated use auraGreen */
  copernicusTeal: '#16B57D',
  copernicusTealDim: '#12966A',
  earthGreen: '#3d7a57',
  earthGreenDim: '#2f6245',
  soilAmber: '#F2A021',
  oceanDeep: '#0A0A0F',
  surfaceElevated: '#141a22',
  mistSlate: '#94a3b8',
  border: 'rgba(255, 255, 255, 0.07)',
  foregroundMuted: '#e2e8f0',
} as const;

/** Ordered palette for pie/bar series */
export const chartColors = [
  brandColors.auraGreen,
  brandColors.earthGreen,
  brandColors.auraOrange,
  '#a78bfa',
  '#f472b6',
] as const;

export const healthColors = {
  excellent: '#3d7a57',
  good: '#5a8f4a',
  warning: '#b45309',
  critical: '#dc2626',
} as const;

export type HealthLevel = keyof typeof healthColors;

/** Colores de polígonos por salud (mapa táctico) */
export const zoneHealthMapColors: Record<HealthLevel, string> = {
  excellent: '#22C55E',
  good: '#22C55E',
  warning: '#F59E0B',
  critical: '#EF4444',
};

export const healthLabelEs: Record<HealthLevel, string> = {
  excellent: 'Excelente',
  good: 'Bueno',
  warning: 'Advertencia',
  critical: 'Crítico',
};

export const healthLabelEnToLevel: Record<string, HealthLevel> = {
  Excellent: 'excellent',
  Good: 'good',
  Warning: 'warning',
  Critical: 'critical',
  Excelente: 'excellent',
  Bueno: 'good',
  Advertencia: 'warning',
  Crítico: 'critical',
};

export const envStatusLabelEs = {
  Optimal: 'Óptimo',
  Suboptimal: 'Subóptimo',
  Stress: 'Estrés',
  Critical: 'Crítico',
} as const;

export type EnvStatusKey = keyof typeof envStatusLabelEs;

export const priorityLabelEs = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
} as const;

export const cropLabelEs: Record<string, string> = {
  soybean: 'Soja',
  corn: 'Maíz',
  wheat: 'Trigo',
  cotton: 'Algodón',
  coffee: 'Café',
  cacao: 'Cacao',
  canola: 'Canola',
  sunflower: 'Girasol',
  barley: 'Cebada',
  rice: 'Arroz',
};

export function getCropLabelEs(crop: string | undefined | null): string {
  if (!crop?.trim()) return 'Cultivo';
  const key = crop.toLowerCase().trim();
  return cropLabelEs[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

export const riskLevels = {
  low: healthColors.excellent,
  medium: healthColors.warning,
  high: healthColors.critical,
  critical: '#991b1b',
} as const;

export const chartAxisStroke = brandColors.mistSlate;
export const chartGridStroke = brandColors.border;

/** Recharts axis tick — legible en móvil y escritorio */
export const chartTick = {
  fontSize: 12,
  fill: brandColors.foregroundMuted,
} as const;

export const chartTickSm = {
  fontSize: 11,
  fill: brandColors.mistSlate,
} as const;

export const chartLegendWrapperStyle = {
  fontSize: 13,
  paddingTop: 12,
  color: brandColors.foregroundMuted,
} as const;

export const chartSeries = {
  investment: chartColors[3],
  revenue: healthColors.good,
  roi: brandColors.soilAmber,
  primary: chartColors[0],
  secondary: chartColors[1],
  /** Laboratorio científico — series temporales */
  ndvi: healthColors.excellent,
  ndre: chartColors[3],
  dpRvi: brandColors.soilAmber,
  rules: healthColors.excellent,
  ml: chartColors[3],
} as const;

/** Recharts tooltip — matches --card / --border */
export const chartTooltipStyle: CSSProperties = {
  backgroundColor: brandColors.surfaceElevated,
  border: `1px solid ${brandColors.border}`,
  borderRadius: '8px',
  color: brandColors.foregroundMuted,
};

/** Crop name → chart color */
export const cropColorMap: Record<string, string> = {
  soybean: chartColors[0],
  corn: chartColors[1],
  wheat: chartColors[2],
  cotton: chartColors[3],
  coffee: chartColors[4],
  cacao: chartColors[4],
  canola: chartColors[3],
  sunflower: chartColors[2],
  barley: chartColors[3],
  rice: chartColors[1],
};

export function getCropColor(crop: string | undefined | null): string {
  if (!crop?.trim()) return brandColors.mistSlate;
  return cropColorMap[crop.toLowerCase().trim()] ?? brandColors.mistSlate;
}

export function getHealthColorByLabel(name: string): string {
  const level = healthLabelEnToLevel[name];
  if (level) return healthColors[level];
  const lower = name.toLowerCase() as HealthLevel;
  if (lower in healthColors) return healthColors[lower];
  return brandColors.mistSlate;
}

export function getGrowthStageEs(daysToMaturity: number): string {
  if (daysToMaturity > 60) return 'Vegetativo temprano';
  if (daysToMaturity > 40) return 'Vegetativo';
  if (daysToMaturity > 20) return 'Floración';
  return 'Llenado de grano';
}

export function healthDistributionToChartData(dist: {
  excellent?: number;
  good?: number;
  warning?: number;
  critical?: number;
}) {
  return (['excellent', 'good', 'warning', 'critical'] as const).map((level) => ({
    name: healthLabelEs[level],
    value: dist[level] ?? 0,
    fill: healthColors[level],
    level,
  }));
}
