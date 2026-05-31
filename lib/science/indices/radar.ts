import type { RadarIndices } from '../types';
import { coerceNumber } from '@/lib/i18n/format-number';

/** Radar Vegetation Index — dual-pol common form. */
export function computeRvi(vv: number, vh: number): number {
  const d = vv + vh;
  return d === 0 ? 0 : (4 * vh) / d;
}

/**
 * Dual Polarimetric RVI (Mandal et al. 2020).
 * β ≈ 0.347 for Sentinel-1 C-band typical incidence.
 */
export function computeDpRvi(vv: number, vh: number, beta = 0.347): number {
  if (vv <= 0 || vh <= 0) return 0;
  const num = (1 + beta * beta) * (vv + beta * vh);
  const den = Math.sqrt(Math.pow(beta * beta * vv + vh, 2) + beta * beta);
  return den === 0 ? 0 : num / den;
}

export function computeVhVvRatio(vv: number, vh: number): number {
  return vv === 0 ? 0 : vh / vv;
}

export function computeAllRadar(vv: number, vh: number): RadarIndices {
  return {
    vv,
    vh,
    vhVvRatio: computeVhVvRatio(vv, vh),
    rvi: computeRvi(vv, vh),
    dpRvi: computeDpRvi(vv, vh),
  };
}

export function radarFromStats(stats: {
  vv?: number | null;
  vh?: number | null;
  rvi?: number | null;
  dpRvi?: number | null;
}): Partial<RadarIndices> {
  const out: Partial<RadarIndices> = {};
  const vv = coerceNumber(stats.vv);
  const vh = coerceNumber(stats.vh);
  if (vv != null) out.vv = vv;
  if (vh != null) out.vh = vh;
  if (vv != null && vh != null) {
    out.vhVvRatio = computeVhVvRatio(vv, vh);
  }
  const rvi = coerceNumber(stats.rvi);
  if (rvi != null) out.rvi = rvi;
  else if (vv != null && vh != null) out.rvi = computeRvi(vv, vh);
  const dpRvi = coerceNumber(stats.dpRvi);
  if (dpRvi != null) out.dpRvi = dpRvi;
  else if (vv != null && vh != null) out.dpRvi = computeDpRvi(vv, vh);
  return out;
}
