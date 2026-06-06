import type { MultisensorAnalysis } from '@/lib/science/types';
import type { IntelligencePackage } from './types';

/** Enriquece narrativa con Geo-Data; no sobrescribe NDVI de DB. */
export function enrichAnalysisWithGeodata(
  analysis: MultisensorAnalysis,
  pkg: IntelligencePackage
): MultisensorAnalysis {
  const flags = [...analysis.anomalyFlags];
  const refs = [...analysis.references];
  let narrative = analysis.narrative;

  if (pkg.fire?.hotspotCount7d && pkg.fire.hotspotCount7d > 0) {
    flags.push('geodata_fire_proximity');
    narrative += ` Geo-Data: ${pkg.fire.hotspotCount7d} hotspots FIRMS en 7d`;
    if (pkg.fire.nearestKm != null) {
      narrative += ` (más cercano ~${pkg.fire.nearestKm.toFixed(1)} km).`;
    }
  }

  if (pkg.optical?.cloudFraction != null && pkg.optical.cloudFraction > 0.4) {
    flags.push('geodata_high_cloud');
    narrative += ' Geo-Data: alta cobertura nubosa regional.';
  }

  refs.push('Data-Historica SC-BO');

  return {
    ...analysis,
    anomalyFlags: flags,
    references: refs,
    narrative,
  };
}
