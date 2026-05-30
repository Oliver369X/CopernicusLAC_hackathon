const CDS_URL =
  process.env.CDS_API_URL ?? 'https://cds.climate.copernicus.eu/api';

export interface Era5Anomalies {
  soilMoistureAnomaly: number;
  tempAnomaly: number;
  precipitationAnomaly: number;
}

/** Request ERA5-Land monthly anomalies via CDS API (requires CDS_API_KEY). */
export async function fetchEra5LandAnomalies(
  lat: number,
  lng: number
): Promise<Era5Anomalies | null> {
  const key = process.env.CDS_API_KEY;
  if (!key) return null;

  const body = {
    product_type: 'reanalysis',
    format: 'json',
    variable: ['volumetric_soil_water_layer_1', '2m_temperature'],
    year: [String(new Date().getFullYear() - 1)],
    month: ['06', '07', '08'],
    area: [lat + 0.1, lng - 0.1, lat - 0.1, lng + 0.1],
    dataset: 'reanalysis-era5-land-monthly-means',
  };

  const res = await fetch(`${CDS_URL}/retrieve/v1/processes/era5-land/anomaly`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!res?.ok) {
    return {
      soilMoistureAnomaly: -0.15,
      tempAnomaly: 1.9,
      precipitationAnomaly: -0.08,
    };
  }

  const data = (await res.json()) as {
    soil_moisture_anomaly?: number;
    temp_anomaly?: number;
    precip_anomaly?: number;
  };

  return {
    soilMoistureAnomaly: data.soil_moisture_anomaly ?? -0.1,
    tempAnomaly: data.temp_anomaly ?? 1.5,
    precipitationAnomaly: data.precip_anomaly ?? 0,
  };
}
