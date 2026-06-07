import type { MultisensorAnalysis } from '@/lib/science/types';
import type { GeodataResolutionSource, IntelligencePackage } from './types';

export interface GeodataEnrichmentMeta {
  geodataUsed: boolean;
  geodataParcelKey?: string;
  geodataSource?: GeodataResolutionSource;
  geodataRegionCode?: string;
}

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
    } else {
      narrative += '.';
    }
  }

  if (pkg.optical?.cloudFraction != null && pkg.optical.cloudFraction > 0.4) {
    flags.push('geodata_high_cloud');
    narrative += ' Geo-Data: alta cobertura nubosa regional.';
  }

  if (pkg.sar?.soilMoisture != null && pkg.sar.soilMoisture < 0.3) {
    flags.push('geodata_sar_stress');
    narrative += ` Geo-Data: humedad SAR baja (${pkg.sar.soilMoisture.toFixed(2)}).`;
  }

  if (pkg.summary) {
    narrative += ` Geo-Data: ${pkg.summary}`;
  }

  refs.push(`Data-Historica ${pkg.regionCode}`);

  if (!analysis.provenance) {
    return {
      ...analysis,
      anomalyFlags: flags,
      references: refs,
      narrative,
    };
  }

  const provenance = {
    ...analysis.provenance,
    geodataUsed: true,
    geodataParcelKey: pkg.parcelKey || undefined,
    geodataSource: pkg.resolutionSource,
    geodataRegionCode: pkg.regionCode,
  };

  return {
    ...analysis,
    anomalyFlags: flags,
    references: refs,
    narrative,
    provenance,
  };
}

export function mergeRegionalGeodataFlags(
  analysis: MultisensorAnalysis,
  regionPkg: IntelligencePackage
): MultisensorAnalysis {
  if (!regionPkg.fire?.hotspotCount7d && regionPkg.optical?.cloudFraction == null) {
    return analysis;
  }
  return enrichAnalysisWithGeodata(analysis, {
    ...regionPkg,
    parcelKey: analysis.provenance?.geodataParcelKey ?? regionPkg.parcelKey,
    resolutionSource: analysis.provenance?.geodataSource ?? 'region',
  });
}
