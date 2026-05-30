import type { SatelliteContext } from '@/lib/services/satellite-correlation';

export function buildMultiSensorNarrative(ctx: SatelliteContext): string {
  const parts: string[] = [];

  if (ctx.s3Lst != null && ctx.s3Lst > 32) {
    parts.push(`Sentinel-3: temperatura de superficie ${ctx.s3Lst.toFixed(1)}°C (estrés térmico).`);
  }

  if (ctx.s1MoistureIndex != null) {
    const pct = Math.round(ctx.s1MoistureIndex * 100);
    if (ctx.s1MoistureIndex < 0.35) {
      parts.push(`Sentinel-1: humedad radar baja (${pct}% índice VH/VV).`);
    } else {
      parts.push(`Sentinel-1: humedad radar ${pct}% índice.`);
    }
  }

  if (ctx.ndre != null) {
    if (ctx.ndre < 0.3) {
      parts.push(
        `Sentinel-2 NDRE ${ctx.ndre.toFixed(2)}: caída de clorofila (detección temprana en dosel).`
      );
    } else {
      parts.push(`Sentinel-2 NDRE ${ctx.ndre.toFixed(2)}.`);
    }
  } else {
    parts.push(`Sentinel-2 NDVI ${ctx.ndvi.toFixed(2)}, NDMI ${ctx.ndmi.toFixed(2)}.`);
  }

  if (ctx.ndviDelta7d != null && ctx.ndviDelta7d <= -0.05) {
    parts.push(`Tendencia 7d: NDVI ${(ctx.ndviDelta7d * 100).toFixed(0)}% — sequía o estrés agudo probable.`);
  } else if (ctx.ndviDelta7d != null && ctx.ndviDelta7d <= -0.02) {
    parts.push('Tendencia 7d: declive gradual — monitorear enfermedad o nutrición.');
  }

  if (!parts.length) {
    return 'Condiciones estables según sensores disponibles.';
  }

  return parts.join(' ');
}
