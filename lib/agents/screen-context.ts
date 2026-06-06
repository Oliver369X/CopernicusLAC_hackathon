import { getPageTitle } from '@/lib/navigation/config';

const SCREEN_HINTS: Record<string, string[]> = {
  '/dashboard': [
    '¿Qué significan estos KPIs?',
    '¿Mi salud promedio está bien?',
    '¿Qué debería revisar primero?',
  ],
  '/monitor': [
    '¿Qué significa este NDVI?',
    '¿Esta zona está bien o mal?',
    '¿Qué acción recomendás?',
  ],
  '/analytics': [
    '¿Cómo leer este informe?',
    '¿Mi riesgo promedio es normal?',
    '¿Qué exportar para el banco?',
  ],
  '/insights': [
    'Resumen de mi cartera hoy',
    '¿Qué zonas tienen más estrés?',
    'Explicá las métricas en simple',
  ],
  '/gestion': [
    '¿Cuántas ha tengo en total?',
    '¿Cómo funciona mi plan?',
    '¿Qué es una zona de manejo?',
  ],
  '/alerts': [
    '¿Qué alertas son urgentes?',
    '¿Cómo interpreto la severidad?',
  ],
};

export function getScreenQuickPrompts(pathname: string): string[] {
  const base = pathname.split('?')[0];
  if (SCREEN_HINTS[base]) return SCREEN_HINTS[base];
  if (base.startsWith('/science')) {
    return ['¿Qué índice debo mirar?', '¿Este cultivo está en estrés?'];
  }
  if (base.startsWith('/field')) {
    return ['¿Cómo registrar una observación?', '¿Para qué sirve el GPS?'];
  }
  return ['Explicá lo que veo en pantalla', '¿Qué debería hacer hoy?'];
}

export function buildScreenContext(
  pathname: string,
  params: { field?: string; zone?: string; crop?: string }
): string {
  const title = getPageTitle(pathname);
  const parts = [`Pantalla: ${title} (${pathname})`];
  if (params.field) parts.push(`fieldId=${params.field}`);
  if (params.zone) parts.push(`zoneId=${params.zone}`);
  if (params.crop) parts.push(`crop=${params.crop}`);
  parts.push(
    'El usuario quiere entender los números visibles, si están bien o mal, y qué heurísticas aplicar.'
  );
  return parts.join(' · ');
}
