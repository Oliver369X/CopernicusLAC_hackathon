import { describe, expect, it } from 'vitest';
import {
  capZoneSplit,
  estimateMonthlyUsd,
  getDefaultZoneSplit,
  getPlanConfig,
  resolveEffectiveTier,
} from '@/lib/billing/plans';

describe('plans', () => {
  it('free tier límite 5 ha', () => {
    expect(getPlanConfig('free').hectareLimit).toBe(5);
  });

  it('growth a 20 ha → $20', () => {
    expect(estimateMonthlyUsd(20, 'hectare')).toBe(20);
  });

  it('scale a 50 ha → $25', () => {
    expect(estimateMonthlyUsd(50, 'hectare')).toBe(25);
  });

  it('cooperative → $0', () => {
    expect(estimateMonthlyUsd(200, 'zone')).toBe(0);
  });

  it('resolveEffectiveTier en frontera 5', () => {
    expect(resolveEffectiveTier(5, 'hectare')).toBe('free');
  });

  it('resolveEffectiveTier en frontera 6', () => {
    expect(resolveEffectiveTier(6, 'hectare')).toBe('growth');
  });

  it('resolveEffectiveTier en frontera 20', () => {
    expect(resolveEffectiveTier(20, 'hectare')).toBe('growth');
  });

  it('resolveEffectiveTier en frontera 21', () => {
    expect(resolveEffectiveTier(21, 'hectare')).toBe('scale');
  });

  it('resolveEffectiveTier en frontera 50', () => {
    expect(resolveEffectiveTier(50, 'hectare')).toBe('scale');
  });

  it('resolveEffectiveTier > 50 lanza', () => {
    expect(() => resolveEffectiveTier(51, 'hectare')).toThrow('HECTARE_LIMIT_EXCEEDED');
  });

  it('capZoneSplit hectare siempre acota al máximo', () => {
    expect(capZoneSplit(8, 1)).toBe(1);
  });

  it('getDefaultZoneSplit por modelo', () => {
    expect(getDefaultZoneSplit('hectare')).toBe(1);
    expect(getDefaultZoneSplit('zone')).toBe(4);
  });
});
