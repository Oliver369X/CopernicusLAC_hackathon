/** Etiquetas en español para fuentes de datos (badges monitoreo, etc.). */

const SOURCE_LABELS: Record<string, string> = {
  database: 'Base de datos',
  mock: 'Datos demo',
  engine: 'Motor de alertas',
  copernicus: 'Copernicus CDSE',
  live: 'En vivo',
};

export function formatDataSourceLabel(source: string): string {
  const key = source.toLowerCase().trim();
  return SOURCE_LABELS[key] ?? source.charAt(0).toUpperCase() + source.slice(1);
}

export function formatDataSourcesUnique(...sources: string[]): string {
  const labels = sources
    .filter(Boolean)
    .map((s) => formatDataSourceLabel(s));
  return [...new Set(labels)].join(' · ');
}
