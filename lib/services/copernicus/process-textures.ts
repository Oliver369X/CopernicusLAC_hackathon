import type { GeoBounds } from '@/lib/types/field';
import { fetchS1Statistics } from './statistics';

export interface SarTextureEstimate {
  contrast: number;
  homogeneity: number;
  source: 'computed' | 'proxy';
}

/**
 * SAR GLCM texture proxy from VV/VH statistics.
 * Full 3×3 GLCM via Process API can replace this when CDSE quota allows.
 */
export async function estimateS1Textures(
  bounds: GeoBounds
): Promise<SarTextureEstimate | null> {
  const s1 = await fetchS1Statistics(bounds);
  if (s1.vv == null || s1.vh == null) return null;

  const ratio = s1.vh / s1.vv;
  const contrast = Math.min(1, Math.abs(ratio - 0.35) * 2.5);
  const homogeneity = Math.max(0, Math.min(1, 1 - contrast * 0.6));

  return { contrast, homogeneity, source: 'proxy' };
}
