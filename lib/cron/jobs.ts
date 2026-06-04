import type { DbClient } from '@/lib/db/adapter';
import type { Field } from '@/lib/types/field';
import { alertEngine, type Alert } from '@/lib/alerts/alert-engine';
import { MOCK_FIELDS } from '@/lib/mock-data/fields';
import {
  getLatestSatelliteForZones,
  getLatestWeatherForField,
  getSatelliteHistoryForZone,
} from '@/lib/data/zone-satellite-metrics';
import { buildSatelliteContext } from '@/lib/services/satellite-correlation';
import { buildMultiSensorNarrative } from '@/lib/services/fusion/multi-sensor-narrative';
import {
  buildCaptureDeeplink,
  detectHotspotFromGrid,
} from '@/lib/services/hotspot/detector';
import { fetchWeatherForField } from '@/lib/services/open-meteo';
import {
  fetchZoneSatelliteReading,
  hasSatelliteCredentials,
  type ZoneSatelliteReading,
} from '@/lib/services/satellite';
import { fetchS2NdviGrid } from '@/lib/services/copernicus/process';
import { fetchZoneSatelliteHistory } from '@/lib/services/copernicus/statistics-history';
import {
  fetchFireAlertsForField,
  fetchFireHotspotsInBounds,
} from '@/lib/services/nasa-firms';
import { dispatchAlertNotifications } from '@/lib/services/notifications/dispatcher';
import { fetchClimateViabilityForField } from '@/lib/services/c3s/viability';
import { isScienceCrop } from '@/lib/science/crops/registry';
import {
  fetchScienceVectorsForZone,
  scienceMetadataFromReading,
} from '@/lib/science/science-ingest';
import { analyzeCropMultisensor, resolveScienceCrop } from '@/lib/science/analyze';
import { persistScienceTimeseries } from '@/lib/science/persist-timeseries';
import { formatScienceAlertNarrative } from '@/lib/science/narrative';

export interface DbAlertInsert {
  field_id: string;
  zone_id: string | null;
  type: string;
  severity: string;
  title: string;
  description: string;
  recommendation: string;
  metrics: Record<string, unknown>;
  dedup_key: string;
}

function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export async function generateAlertsFromDb(
  service: DbClient,
  fields: Field[]
): Promise<DbAlertInsert[]> {
  const alerts: DbAlertInsert[] = [];
  const day = todayDateString();

  for (const field of fields) {
    const zoneIds = field.zones.map((z) => z.id);
    const satMap = await getLatestSatelliteForZones(service, zoneIds);
    const weather = await getLatestWeatherForField(service, field.id);

    for (const zone of field.zones) {
      const sat = satMap.get(zone.id);
      const history = await getSatelliteHistoryForZone(service, zone.id, 14);
      const ndvi = sat?.ndvi ?? zone.ndviAverage;
      const ndmi = sat?.ndmi ?? zone.ndmiAverage;
      const temp = weather?.temp ?? zone.temperatureAverage;
      const soil = weather?.soilMoisture ?? zone.soilMoistureAverage;

      const engineAlerts = [
        ...alertEngine.checkThresholds(
          field.crop,
          field.id,
          zone.id,
          ndvi,
          ndmi,
          temp,
          soil,
          field.daysFromPlanting
        ),
        ...alertEngine.checkAnomalies(
          field.crop,
          field.id,
          zone.id,
          ndvi,
          history.length > 1
            ? history.reduce((s, h) => s + h.ndvi, 0) / history.length
            : zone.ndviAverage,
          0.08
        ),
      ];

      for (const a of engineAlerts) {
        alerts.push({
          field_id: a.fieldId,
          zone_id: a.zoneId,
          type: a.type,
          severity: a.severity,
          title: a.title,
          description: a.description,
          recommendation: a.recommendation,
          metrics: { ...a.metrics, source: sat?.source ?? 'mock' },
          dedup_key: `${day}-${a.type}-${a.fieldId}-${a.zoneId}-${a.title}`,
        });
      }

      const scienceCrop = resolveScienceCrop(field);
      if (scienceCrop && sat?.source !== 'mock') {
        try {
          const analysis = await analyzeCropMultisensor(
            scienceCrop,
            field,
            zone.id,
            service
          );
          if (
            analysis.healthLabel === 'warning' ||
            analysis.healthLabel === 'critical' ||
            analysis.anomalyFlags.length >= 2
          ) {
            const narrative = formatScienceAlertNarrative(analysis);
            alerts.push({
              field_id: field.id,
              zone_id: zone.id,
              type: 'science_multisensor',
              severity:
                analysis.healthLabel === 'critical' ? 'critical' : 'warning',
              title: `Science Lab — ${zone.name} (${scienceCrop})`,
              description: narrative,
              recommendation: `Ver análisis completo en /science/${scienceCrop}?field=${field.id}`,
              metrics: {
                fusionScore: analysis.fusionScore,
                fusionScoreMl: analysis.fusionScoreMl,
                healthLabel: analysis.healthLabel,
                healthLabelMl: analysis.healthLabelMl,
                anomalyFlags: analysis.anomalyFlags,
                ndre: analysis.optical.ndre,
                dpRvi: analysis.radar.dpRvi,
                algorithmVersion: analysis.algorithmVersion,
              },
              dedup_key: `${day}-science-${field.id}-${zone.id}-${analysis.healthLabel}`,
            });
          }
        } catch {
          // science alert optional
        }
      }

      const ctx = buildSatelliteContext(
        sat ?? null,
        weather,
        history,
        {
          ndvi: zone.ndviAverage,
          ndmi: zone.ndmiAverage,
          temp: zone.temperatureAverage,
          soil: zone.soilMoistureAverage,
        }
      );

      const stressIndex = ctx.ndre ?? ctx.ndvi;
      if (stressIndex < 0.35 && sat?.source !== 'mock') {
        const narrative = buildMultiSensorNarrative(ctx);
        let hotspotLink: string | undefined;
        if (sat?.ndviGrid?.ndvi) {
          const hotspot = detectHotspotFromGrid(zone.bounds, sat.ndviGrid.ndvi, 'min');
          if (hotspot) {
            hotspotLink = buildCaptureDeeplink(field.id, zone.id, hotspot);
          }
        }
        alerts.push({
          field_id: field.id,
          zone_id: zone.id,
          type: 'hotspot_stress',
          severity: stressIndex < 0.25 ? 'critical' : 'warning',
          title: `Estrés detectado en ${zone.name}`,
          description: narrative,
          recommendation: hotspotLink
            ? `Ir al hotspot: ${hotspotLink}`
            : 'Capture una foto en la zona para confirmar diagnóstico.',
          metrics: {
            ndvi: ctx.ndvi,
            ndre: ctx.ndre,
            hotspotLink,
            stressPattern: ctx.stressPattern,
          },
          dedup_key: `${day}-hotspot-${field.id}-${zone.id}`,
        });
      }
    }
  }

  return alerts;
}

export async function runWeatherJob(
  service: DbClient,
  fields: Field[]
): Promise<unknown[]> {
  const results = [];
  for (const field of fields) {
    const weather = await fetchWeatherForField(field.center.lat, field.center.lng);
    await service.from('weather_readings').insert({
      field_id: field.id,
      temp: weather.temp,
      humidity: weather.humidity,
      precipitation: weather.precipitation,
      wind: weather.wind,
      soil_moisture: weather.soilMoisture,
      et0: weather.et0,
      raw_metadata: weather,
    });
    results.push({ fieldId: field.id, ...weather });
  }
  return results;
}

async function ensureNdviGrid(
  zone: Field['zones'][number],
  reading: ZoneSatelliteReading
): Promise<ZoneSatelliteReading> {
  if (reading.ndviGrid?.ndvi?.length) {
    return {
      ...reading,
      rawMetadata: { ...reading.rawMetadata, gridStatus: 'ok' },
    };
  }

  const hasS2 = reading.missions.includes('sentinel-2');
  if (!hasS2 || reading.source === 'mock') {
    return {
      ...reading,
      rawMetadata: { ...reading.rawMetadata, gridStatus: 'skipped_no_s2' },
    };
  }

  await new Promise((r) => setTimeout(r, 500));
  let grid = await fetchS2NdviGrid(zone.bounds);
  if (!grid) {
    await new Promise((r) => setTimeout(r, 500));
    grid = await fetchS2NdviGrid(zone.bounds);
  }

  return {
    ...reading,
    ndviGrid: grid,
    rawMetadata: {
      ...reading.rawMetadata,
      gridStatus: grid ? 'ok' : 'missing',
      gridRetry: true,
    },
  };
}

const SATELLITE_ZONE_DELAY_MS = Number(process.env.SATELLITE_ZONE_DELAY_MS ?? 2000);

export async function runSatelliteJob(
  service: DbClient,
  fields: Field[]
): Promise<unknown[]> {
  const readingDate = todayDateString();
  const hasCredentials = hasSatelliteCredentials();
  const results = [];

  for (const field of fields) {
    for (const zone of field.zones) {
      await new Promise((r) => setTimeout(r, SATELLITE_ZONE_DELAY_MS));
      let reading = await fetchZoneSatelliteReading(zone, field.center);

      if (hasCredentials && reading.source === 'mock' && reading.missions.length === 0) {
        results.push({
          zoneId: zone.id,
          skipped: true,
          reason: 'cdse_no_data',
        });
        continue;
      }

      if (hasCredentials && reading.source !== 'mock') {
        reading = await ensureNdviGrid(zone, reading);
      }

      const vectors = isScienceCrop(field.crop)
        ? await fetchScienceVectorsForZone(zone, field.crop, reading.s3Lst)
        : null;

      const scienceMeta = scienceMetadataFromReading(
        field.crop,
        reading.s1Vv,
        reading.s1Vh,
        vectors
      );

      const row = {
        zone_id: zone.id,
        ndvi: Number.isFinite(reading.ndvi) ? reading.ndvi : zone.ndviAverage,
        ndmi: Number.isFinite(reading.ndmi) ? reading.ndmi : zone.ndmiAverage,
        ndre: Number.isFinite(reading.ndre ?? NaN) ? reading.ndre : null,
        s1_vh: reading.s1Vh,
        s1_vv: reading.s1Vv,
        s1_moisture_index: reading.s1MoistureIndex,
        s3_lst: reading.s3Lst,
        cloud_cover: reading.cloudCover,
        ndvi_grid: reading.ndviGrid,
        scene_date: reading.sceneDate,
        source: reading.source,
        reading_date: readingDate,
        science_metadata: scienceMeta,
        raw_metadata: {
          ...reading.rawMetadata,
          missions: reading.missions,
          gridStatus: reading.rawMetadata.gridStatus ?? (reading.ndviGrid ? 'ok' : 'missing'),
        },
      };

      const { error } = await service
        .from('satellite_readings')
        .upsert(row, { onConflict: 'zone_id,reading_date' });

      if (error) await service.from('satellite_readings').insert(row);

      await service
        .from('zones')
        .update({
          ndvi_average: Number.isFinite(reading.ndvi) ? reading.ndvi : zone.ndviAverage,
          ndmi_average: Number.isFinite(reading.ndmi) ? reading.ndmi : zone.ndmiAverage,
        })
        .eq('id', zone.id);

      if (isScienceCrop(field.crop) && vectors) {
        try {
          const analysis = await analyzeCropMultisensor(
            field.crop,
            field,
            zone.id,
            service
          );
          await persistScienceTimeseries(service, field.id, field.crop, analysis);
        } catch {
          await service.from('science_timeseries').insert({
            zone_id: zone.id,
            field_id: field.id,
            crop: field.crop,
            captured_at: new Date().toISOString(),
            optical: vectors.optical,
            radar: vectors.radar,
            lst: vectors.lst,
            algorithm_version: vectors.algorithmVersion,
          });
        }
      }

      results.push({ zoneId: zone.id, ...reading });
      const { trackImportJobProgressForZone } = await import(
        '@/lib/import-jobs/track-progress'
      );
      await trackImportJobProgressForZone(zone.id);
    }
  }

  return results;
}

/** Backfill satellite_readings from CDSE Statistical API (multi-week history). */
export async function runSatelliteBackfillJob(
  service: DbClient,
  fields: Field[],
  days = 90
): Promise<unknown[]> {
  const hasCredentials = hasSatelliteCredentials();
  if (!hasCredentials) {
    return [{ error: 'no_satellite_credentials' }];
  }

  const results: unknown[] = [];

  for (const field of fields) {
    for (const zone of field.zones) {
      await new Promise((r) => setTimeout(r, 400));
      const history = await fetchZoneSatelliteHistory(zone.bounds, days, field.center);

      if (!history.length) {
        results.push({ zoneId: zone.id, inserted: 0, reason: 'no_cdse_history' });
        continue;
      }

      let inserted = 0;
      for (const point of history) {
        const scienceMeta = scienceMetadataFromReading(
          field.crop,
          point.s1Vv,
          point.s1Vh,
          null
        );

        const row = {
          zone_id: zone.id,
          ndvi: point.ndvi,
          ndmi: point.ndmi ?? zone.ndmiAverage,
          ndre: point.ndre,
          s1_vh: point.s1Vh,
          s1_vv: point.s1Vv,
          s1_moisture_index: point.s1MoistureIndex,
          s3_lst: point.s3Lst,
          cloud_cover: point.cloudCover,
          ndvi_grid: null,
          scene_date: point.sceneDate,
          source: 'copernicus',
          reading_date: point.readingDate,
          science_metadata: scienceMeta,
          raw_metadata: {
            backfill: true,
            days,
            missions: [
              'sentinel-2',
              ...(point.s1Vv != null ? ['sentinel-1'] : []),
              ...(point.s3Lst != null ? ['sentinel-3'] : []),
            ],
          },
        };

        const { error } = await service
          .from('satellite_readings')
          .upsert(row, { onConflict: 'zone_id,reading_date' });

        if (error) {
          await service.from('satellite_readings').insert(row);
        }
        inserted++;
      }

      const latest = history[history.length - 1];
      if (latest?.ndvi != null) {
        await service
          .from('zones')
          .update({
            ndvi_average: latest.ndvi,
            ndmi_average: latest.ndmi ?? zone.ndmiAverage,
          })
          .eq('id', zone.id);
      }

      results.push({ zoneId: zone.id, inserted, days });
    }
  }

  return results;
}

export async function runFiresJob(
  service: DbClient,
  fields: Field[]
): Promise<unknown[]> {
  const day = todayDateString();
  const fireResults = [];

  for (const field of fields) {
    const hotspots = await fetchFireHotspotsInBounds(field.bounds, 1);
    for (const hotspot of hotspots) {
      await service.from('fire_detections').insert({
        field_id: field.id,
        detected_at: hotspot.detectedAt,
        lat: hotspot.lat,
        lng: hotspot.lng,
        confidence: hotspot.confidence,
        satellite: hotspot.satellite,
        source: 'nasa_firms',
        raw_metadata: hotspot,
      });
    }

    for (const alert of await fetchFireAlertsForField(field)) {
      fireResults.push(alert);
      await service.from('alerts').upsert(
        {
          field_id: field.id,
          type: 'fire_proximity',
          severity: alert.distanceKm < 2 ? 'critical' : 'warning',
          title: `Incendio detectado a ${alert.distanceKm} km`,
          description: `Hotspot ${alert.hotspot.satellite} cerca de ${field.name}.`,
          recommendation:
            'Evacue ganado y proteja cosecha almacenada. Monitoree viento y humo.',
          metrics: { distanceKm: alert.distanceKm, hotspot: alert.hotspot },
          dedup_key: `${day}-fire-${field.id}-${alert.hotspot.lat.toFixed(3)}`,
        },
        { onConflict: 'dedup_key' }
      );
    }
  }

  return fireResults;
}

export async function runClimateJob(
  service: DbClient,
  fields: Field[]
): Promise<unknown[]> {
  const results = [];
  const day = todayDateString();

  for (const field of fields) {
    const viability = await fetchClimateViabilityForField(field);
    if (!viability) continue;

    await service.from('climate_readings').insert({
      field_id: field.id,
      soil_moisture_anomaly: viability.soilMoistureAnomaly,
      temp_anomaly: viability.tempAnomaly,
      drought_index: viability.droughtIndex,
      viability_score: viability.viabilityScore,
      projection_year: viability.projectionYear,
      raw_metadata: viability,
    });

    if (viability.viabilityScore < 0.45) {
      await service.from('alerts').upsert(
        {
          field_id: field.id,
          type: 'climate_viability',
          severity: viability.viabilityScore < 0.3 ? 'critical' : 'warning',
          title: `Riesgo climático 2030 — ${field.name}`,
          description: viability.summary,
          recommendation: viability.recommendation,
          metrics: viability,
          dedup_key: `${day}-climate-${field.id}`,
        },
        { onConflict: 'dedup_key' }
      );
    }

    results.push({ fieldId: field.id, ...viability });
  }

  return results;
}

export async function runAlertsJob(
  service: DbClient,
  fields: Field[]
): Promise<{ count: number; critical: string[] }> {
  const alerts = await generateAlertsFromDb(service, fields);
  const critical: string[] = [];
  let count = 0;

  for (const alert of alerts.slice(0, 40)) {
    const { data, error } = await service
      .from('alerts')
      .upsert(alert, { onConflict: 'dedup_key' })
      .select()
      .single();

    if (!error && data) {
      count++;
      if (alert.severity === 'critical') critical.push(alert.title);
      await dispatchAlertNotifications(service, alert, data.id as string).catch(
        () => undefined
      );
    }
  }

  return { count, critical };
}

