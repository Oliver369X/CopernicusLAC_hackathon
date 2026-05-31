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
console.log('token', tokenRes.status);

// Pampas demo field bbox approx
const bbox = [-62.32, -34.92, -62.28, -34.88];
const evalscript = `//VERSION=3
function setup() {
  return {
    input: ["B04", "B08", "B11", "SCL"],
    output: [
      { id: "ndvi", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(s) {
  if (s.SCL >= 8 && s.SCL <= 10) return { ndvi: [NaN], dataMask: [0] };
  return { ndvi: [(s.B08 - s.B04) / (s.B08 + s.B04)], dataMask: [1] };
}`;

const to = new Date().toISOString();
const from = new Date(Date.now() - 30 * 864e5).toISOString();

const body = {
  input: {
    bounds: {
      bbox,
      properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' },
    },
    data: [
      {
        type: 'sentinel-2-l2a',
        dataFilter: { timeRange: { from, to }, maxCloudCoverage: 40 },
      },
    ],
  },
  aggregation: {
    timeRange: { from, to },
    aggregationInterval: { of: 'P1D' },
    evalscript,
  },
};

const res = await fetch('https://sh.dataspace.copernicus.eu/api/v1/statistics', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});
console.log('stats', res.status, await res.text());
