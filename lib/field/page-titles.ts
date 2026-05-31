export const FIELD_PAGE_TITLES: Record<string, string> = {
  '/field': 'Monitor de campo',
  '/field/capture': 'Capturar observación',
  '/field/diagnostics': 'Diagnóstico IA',
  '/field/history': 'Historial',
};

export function getFieldPageTitle(pathname: string): string {
  if (FIELD_PAGE_TITLES[pathname]) return FIELD_PAGE_TITLES[pathname];
  if (pathname.startsWith('/field/diagnostics')) return FIELD_PAGE_TITLES['/field/diagnostics'];
  if (pathname.startsWith('/field/capture')) return FIELD_PAGE_TITLES['/field/capture'];
  if (pathname.startsWith('/field/history')) return FIELD_PAGE_TITLES['/field/history'];
  return FIELD_PAGE_TITLES['/field'];
}
