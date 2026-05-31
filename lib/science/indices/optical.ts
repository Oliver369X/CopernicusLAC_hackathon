import type { OpticalBands, OpticalIndices } from '../types';
import { coerceNumber } from '@/lib/i18n/format-number';

const SAVI_L = 0.5;

export function computeNdvi(nir: number, red: number): number {
  const d = nir + red;
  return d === 0 ? 0 : (nir - red) / d;
}

export function computeEvi(nir: number, red: number, blue: number): number {
  const d = nir + 6 * red - 7.5 * blue + 1;
  return d === 0 ? 0 : (2.5 * (nir - red)) / d;
}

export function computeSavi(nir: number, red: number, l = SAVI_L): number {
  const d = nir + red + l;
  return d === 0 ? 0 : ((nir - red) / d) * (1 + l);
}

export function computeNdre(nir: number, redEdge: number): number {
  const d = nir + redEdge;
  return d === 0 ? 0 : (nir - redEdge) / d;
}

export function computeCiRedEdge(nir: number, redEdge: number): number {
  return redEdge === 0 ? 0 : nir / redEdge - 1;
}

export function computeNdwi(green: number, nir: number): number {
  const d = green + nir;
  return d === 0 ? 0 : (green - nir) / d;
}

export function computeLswi(nir: number, swir: number): number {
  const d = nir + swir;
  return d === 0 ? 0 : (nir - swir) / d;
}

export function computeMsi(swir: number, nir: number): number {
  return nir === 0 ? 0 : swir / nir;
}

/** REDSI — wheat yellow rust (3-band variant, not NDRE). */
export function computeRedsi(nir: number, redEdge: number, red: number): number {
  const d = nir + redEdge + red * 0.1;
  return d === 0 ? 0 : (nir - redEdge) / d;
}

export function computeAllOptical(bands: OpticalBands): OpticalIndices {
  return {
    ndvi: computeNdvi(bands.b08, bands.b04),
    evi: computeEvi(bands.b08, bands.b04, bands.b02),
    savi: computeSavi(bands.b08, bands.b04),
    ndre: computeNdre(bands.b08, bands.b05),
    ciRedEdge: computeCiRedEdge(bands.b08, bands.b05),
    ndwi: computeNdwi(bands.b03, bands.b08),
    lswi: computeLswi(bands.b08, bands.b11),
    msi: computeMsi(bands.b11, bands.b08),
    redsi: computeRedsi(bands.b08, bands.b05, bands.b04),
  };
}

export function opticalFromStats(stats: {
  ndvi?: number | null;
  ndmi?: number | null;
  ndre?: number | null;
  evi?: number | null;
  savi?: number | null;
  ndwi?: number | null;
  msi?: number | null;
  ciRedEdge?: number | null;
  redsi?: number | null;
}): Partial<OpticalIndices> {
  const out: Partial<OpticalIndices> = {};
  const set = (key: keyof OpticalIndices, raw: unknown) => {
    const n = coerceNumber(raw);
    if (n != null) out[key] = n;
  };
  set('ndvi', stats.ndvi);
  set('ndre', stats.ndre);
  set('evi', stats.evi);
  set('savi', stats.savi);
  set('ndwi', stats.ndwi);
  set('msi', stats.msi);
  set('ciRedEdge', stats.ciRedEdge);
  set('redsi', stats.redsi);
  if (stats.ndmi != null) set('lswi', stats.ndmi);
  return out;
}
