export interface WeatherReading {
  temp: number;
  humidity: number;
  precipitation: number;
  wind: number;
  soilMoisture: number | null;
  et0: number | null;
  capturedAt: string;
}

function getOpenMeteoBaseUrl(): string {
  const apiKey = process.env.OPEN_METEO_API_KEY;
  if (apiKey) {
    return 'https://customer-api.open-meteo.com/v1/forecast';
  }
  return 'https://api.open-meteo.com/v1/forecast';
}

export async function fetchWeatherForField(
  lat: number,
  lng: number
): Promise<WeatherReading> {
  const url = new URL(getOpenMeteoBaseUrl());
  url.searchParams.set('latitude', lat.toString());
  url.searchParams.set('longitude', lng.toString());
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,soil_moisture_0_to_1cm,et0_fao_evapotranspiration'
  );
  url.searchParams.set('timezone', 'auto');

  const apiKey = process.env.OPEN_METEO_API_KEY;
  if (apiKey) url.searchParams.set('apikey', apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Open-Meteo request failed');

  const data = await res.json();
  const current = data.current;
  const soilRaw = current.soil_moisture_0_to_1cm;

  return {
    temp: current.temperature_2m ?? 20,
    humidity: current.relative_humidity_2m ?? 60,
    precipitation: current.precipitation ?? 0,
    wind: current.wind_speed_10m ?? 0,
    soilMoisture: soilRaw != null ? Math.round(soilRaw * 100) : null,
    et0: current.et0_fao_evapotranspiration ?? null,
    capturedAt: new Date().toISOString(),
  };
}
