/** Elimina fuentes vacías o duplicadas para keys de React estables. */
export function uniqueSources(sources: string[] | undefined): string[] {
  if (!sources?.length) return [];
  return [...new Set(sources.map((s) => s.trim()).filter(Boolean))];
}
