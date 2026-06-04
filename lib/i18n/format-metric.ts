import { formatDecimal } from '@/lib/i18n/format-number';

export type MetricDataState = 'live' | 'seed' | 'pending' | 'unavailable';

export interface MetricDisplayMeta {
  source?: 'copernicus' | 'open_meteo' | 'seed' | 'mock' | string;
  label?: string;
}

export interface MetricDisplay {
  text: string;
  state: MetricDataState;
  cta?: { label: string; href: string };
}

export function formatMetricDisplay(
  value: unknown,
  meta?: MetricDisplayMeta
): MetricDisplay {
  const rounded = formatDecimal(value, 2);
  if (rounded !== '—') {
    const state: MetricDataState =
      meta?.source === 'seed' || meta?.source === 'mock' ? 'seed' : 'live';
    return { text: rounded, state };
  }

  if (meta?.source === 'seed' || meta?.source === 'mock') {
    return {
      text: 'Dato demo',
      state: 'seed',
      cta: { label: 'Sincronizar satélite', href: '/onboarding' },
    };
  }

  return {
    text: 'Pendiente',
    state: 'pending',
    cta: {
      label: meta?.label ?? 'Configurar parcelas',
      href: '/onboarding',
    },
  };
}

export function formatMetricDisplayOrUnavailable(
  value: unknown,
  meta?: MetricDisplayMeta
): MetricDisplay {
  const base = formatMetricDisplay(value, meta);
  if (base.state !== 'pending') return base;
  return {
    ...base,
    state: 'unavailable',
    text: 'No disponible',
    cta: { label: 'Ver estado del pipeline', href: '/api/health/data-pipeline' },
  };
}
