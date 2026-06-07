/** Etiquetas en español para fuentes de datos (badges monitoreo, etc.). */

import type { MetricDataState } from '@/lib/i18n/format-metric';

export const METRIC_STATE_LABELS: Record<MetricDataState, string> = {
  live: 'Dato en vivo',
  seed: 'Dato demo / seed',
  pending: 'Copernicus pendiente',
  unavailable: 'No disponible',
};

const SOURCE_LABELS: Record<string, string> = {
  database: 'Base de datos',
  mock: 'Datos demo',
  engine: 'Motor de alertas',
  copernicus: 'Copernicus CDSE',
  'geodata-cdse': 'CDSE · tile trimestral',
  'geodata-demo': 'Demo sintético geo-data',
  'seed-personas-3y': 'Seed demo personas 3y',
  'seed-sj-demo': 'Seed demo San Julián',
  live: 'En vivo',
  pending: 'Copernicus pendiente',
  open_meteo: 'Open-Meteo',
  seed: 'Seed SQL',
  geodata: 'Data-Historica',
  satellite_readings: 'Lecturas satelitales locales',
};

export function metricStateIcon(state: MetricDataState): string {
  const icons: Record<MetricDataState, string> = {
    live: '●',
    seed: '◆',
    pending: '○',
    unavailable: '✕',
  };
  return icons[state];
}

export function formatDataSourceLabel(source: string | undefined | null): string {
  if (!source?.trim()) return 'Fuente desconocida';
  const key = source.toLowerCase().trim();
  return SOURCE_LABELS[key] ?? source.charAt(0).toUpperCase() + source.slice(1);
}

export function formatDataSourcesUnique(...sources: string[]): string {
  const labels = sources
    .filter(Boolean)
    .map((s) => formatDataSourceLabel(s));
  return [...new Set(labels)].join(' · ');
}
