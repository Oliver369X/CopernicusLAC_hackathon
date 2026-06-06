import type { ScienceCropId } from '@/lib/science/types';

export interface FieldContext {
  fieldId: string;
  zoneId?: string;
  crop?: string;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') {
      search.set(key, value);
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function buildMonitorUrl(ctx: FieldContext): string {
  return `/monitor${buildQuery({
    field: ctx.fieldId,
    zone: ctx.zoneId,
    crop: ctx.crop,
  })}`;
}

export function buildScienceUrl(
  ctx: FieldContext & { crop: ScienceCropId; tab?: 'client' | 'lab' }
): string {
  return `/science/${ctx.crop}${buildQuery({
    field: ctx.fieldId,
    zone: ctx.zoneId,
    tab: ctx.tab,
  })}`;
}

export function buildStudiesUrl(
  ctx: FieldContext & { crop: ScienceCropId }
): string {
  return `/science/studies${buildQuery({
    crop: ctx.crop,
    field: ctx.fieldId,
    zone: ctx.zoneId,
  })}`;
}

export function buildInsightsUrl(ctx: {
  fieldId?: string;
  zoneId?: string;
  prompt?: string;
}): string {
  return `/insights${buildQuery({
    field: ctx.fieldId,
    zone: ctx.zoneId,
    prompt: ctx.prompt,
  })}`;
}
