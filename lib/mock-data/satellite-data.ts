/**
 * Mock Satellite Data Service
 * Generates realistic NDVI (Normalized Difference Vegetation Index),
 * soil moisture, and temperature data for agricultural monitoring
 */

export interface SatelliteData {
  fieldId: string;
  date: Date;
  ndvi: number[][];
  ndmi: number[][];
  temperature: number[][];
  soilMoisture: number[][];
  cloudCover: number;
  timestamp: string;
  isRealGrid?: boolean;
  gridPending?: boolean;
}

// Simulate Perlin-like noise for realistic patterns
function generateNoise(
  width: number,
  height: number,
  seed: number,
  scale: number = 0.5
): number[][] {
  const grid: number[][] = [];

  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      // Deterministic pseudo-random based on coordinates and seed
      const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43758.5453) * 0.5 + 0.5;
      // Add some local variation
      const smooth = Math.sin((x + y) * 0.1) * 0.3 + 0.7;
      grid[y][x] = (n + smooth) * scale;
    }
  }

  return grid;
}

// Generate NDVI values (-1 to 1, where 1 is healthiest vegetation)
function generateNDVI(width: number, height: number, date: Date): number[][] {
  const seed = date.getTime() / 1000000;
  const noise = generateNoise(width, height, seed, 0.7);

  // Add seasonal variation
  const month = date.getMonth();
  const seasonalFactor = 0.3 + 0.7 * Math.cos((month - 5) * Math.PI / 6);

  return noise.map((row) =>
    row.map((val) => {
      const ndvi = val * seasonalFactor - 0.1;
      return Math.max(-1, Math.min(1, ndvi));
    })
  );
}

// Generate NDMI values (-1 to 1, moisture index)
function generateNDMI(width: number, height: number, date: Date): number[][] {
  const seed = date.getTime() / 1000000 + 1000;
  const noise = generateNoise(width, height, seed, 0.6);

  return noise.map((row) =>
    row.map((val) => {
      const ndmi = val * 0.8 - 0.1;
      return Math.max(-1, Math.min(1, ndmi));
    })
  );
}

// Generate temperature in Celsius
function generateTemperature(
  width: number,
  height: number,
  date: Date
): number[][] {
  const seed = date.getTime() / 1000000 + 2000;
  const noise = generateNoise(width, height, seed, 1);

  const month = date.getMonth();
  const baseTemp = 15 + 10 * Math.sin(month * Math.PI / 6);

  return noise.map((row) =>
    row.map((val) => baseTemp + val * 5)
  );
}

// Generate soil moisture percentage
function generateSoilMoisture(
  width: number,
  height: number,
  date: Date
): number[][] {
  const seed = date.getTime() / 1000000 + 3000;
  const noise = generateNoise(width, height, seed, 1);

  return noise.map((row) =>
    row.map((val) => Math.max(20, Math.min(80, 50 + val * 20)))
  );
}

/**
 * Generate mock satellite data for a field
 */
export function generateSatelliteData(
  fieldId: string,
  date: Date = new Date(),
  gridSize: number = 50
): SatelliteData {
  return {
    fieldId,
    date,
    ndvi: generateNDVI(gridSize, gridSize, date),
    ndmi: generateNDMI(gridSize, gridSize, date),
    temperature: generateTemperature(gridSize, gridSize, date),
    soilMoisture: generateSoilMoisture(gridSize, gridSize, date),
    cloudCover: Math.random() * 30,
    timestamp: date.toISOString(),
  };
}

/**
 * Generate time-series satellite data for historical analysis
 */
export function generateTimeSeries(
  fieldId: string,
  days: number = 30,
  gridSize: number = 50
): SatelliteData[] {
  const data: SatelliteData[] = [];
  const now = new Date();

  for (let i = days; i > 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push(generateSatelliteData(fieldId, date, gridSize));
  }

  return data;
}

/**
 * Calculate health status from NDVI values
 */
export function calculateHealthStatus(ndviGrid: number[][]): string {
  const values = ndviGrid.flat();
  const average = values.reduce((a, b) => a + b, 0) / values.length;

  if (average > 0.6) return 'excellent';
  if (average > 0.4) return 'good';
  if (average > 0.2) return 'warning';
  return 'critical';
}

/**
 * Get average index value for a grid
 */
export function getAverageValue(grid: number[][] | null | undefined): number {
  if (!grid?.length) return 0;
  const values = grid.flat().filter((v) => Number.isFinite(v));
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
