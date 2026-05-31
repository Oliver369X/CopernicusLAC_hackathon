import { loadEnv } from './load-env.mjs';

loadEnv();

const id = process.env.COPERNICUS_CLIENT_ID;
const secret = process.env.COPERNICUS_CLIENT_SECRET;
const tokenRes = await fetch(
  'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: id,
      client_secret: secret,
    }),
  }
);
const { access_token: token } = await tokenRes.json();
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

const bbox = [-62.32, -34.92, -62.28, -34.88];
const from = new Date(Date.now() - 30 * 864e5).toISOString();
const to = new Date().toISOString();
const timeRange = { from, to };

async function stats(dataType, evalscript) {
  const body = {
    input: {
      bounds: {
        bbox,
        properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' },
      },
      data: [{ type: dataType, dataFilter: { timeRange, mosaickingOrder: 'leastCC' } }],
    },
    aggregation: {
      timeRange,
      aggregationInterval: { of: 'P1D' },
      evalscript,
      resx: 0.0001,
      resy: 0.0001,
    },
  };
  const res = await fetch('https://sh.dataspace.copernicus.eu/api/v1/statistics', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log(`\n=== ${dataType} stats ${res.status} ===`);
  try {
    const json = JSON.parse(text);
    if (json.error?.errors) console.log('errors:', JSON.stringify(json.error.errors));
    console.log(text.slice(0, 500));
  } catch {
    console.log(text.slice(0, 600));
  }
}

const s1Script = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["VV", "VH", "dataMask"] }],
    output: [
      { id: "vh", bands: 1, sampleType: "FLOAT32" },
      { id: "vv", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(samples) {
  if (samples.dataMask === 0) return { vh: [NaN], vv: [NaN], dataMask: [0] };
  return { vh: [samples.VH], vv: [samples.VV], dataMask: [1] };
}`;

const s3Script = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["S8", "dataMask"], units: "BRIGHTNESS_TEMPERATURE" }],
    output: [
      { id: "lst", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(samples) {
  if (samples.dataMask === 0) return { lst: [NaN], dataMask: [0] };
  return { lst: [samples.S8 - 273.15], dataMask: [1] };
}`;

await stats('sentinel-1-grd', s1Script);

async function statsS1Filtered() {
  const body = {
    input: {
      bounds: {
        bbox,
        properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' },
      },
      data: [{
        type: 'sentinel-1-grd',
        dataFilter: {
          timeRange,
          mosaickingOrder: 'leastRecent',
          polarization: 'DV',
          acquisitionMode: 'IW',
        },
      }],
    },
    aggregation: {
      timeRange,
      aggregationInterval: { of: 'P5D' },
      evalscript: s1Script,
      resx: 0.0001,
      resy: 0.0001,
    },
  };
  const res = await fetch('https://sh.dataspace.copernicus.eu/api/v1/statistics', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log(`\n=== sentinel-1-grd (IW/DV) ${res.status} ===`);
  console.log(text.slice(0, 500));
}

await statsS1Filtered();
await stats('sentinel-3-slstr', s3Script);
