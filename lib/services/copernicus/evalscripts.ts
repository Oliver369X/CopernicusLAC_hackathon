export const S2_EXTENDED_STATS_EVALSCRIPT = `
//VERSION=3
function setup() {
  return {
    input: ["B02", "B03", "B04", "B05", "B08", "B11", "SCL"],
    output: [
      { id: "ndvi", bands: 1, sampleType: "FLOAT32" },
      { id: "ndmi", bands: 1, sampleType: "FLOAT32" },
      { id: "ndre", bands: 1, sampleType: "FLOAT32" },
      { id: "evi", bands: 1, sampleType: "FLOAT32" },
      { id: "savi", bands: 1, sampleType: "FLOAT32" },
      { id: "ndwi", bands: 1, sampleType: "FLOAT32" },
      { id: "msi", bands: 1, sampleType: "FLOAT32" },
      { id: "cired", bands: 1, sampleType: "FLOAT32" },
      { id: "redsi", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(s) {
  if (s.SCL >= 8 && s.SCL <= 10) {
    return {
      ndvi: [NaN], ndmi: [NaN], ndre: [NaN], evi: [NaN], savi: [NaN],
      ndwi: [NaN], msi: [NaN], cired: [NaN], redsi: [NaN], dataMask: [0]
    };
  }
  let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04);
  let ndmi = (s.B08 - s.B11) / (s.B08 + s.B11);
  let ndre = (s.B08 - s.B05) / (s.B08 + s.B05);
  let evi = 2.5 * (s.B08 - s.B04) / (s.B08 + 6.0 * s.B04 - 7.5 * s.B02 + 1.0);
  let savi = (s.B08 - s.B04) / (s.B08 + s.B04 + 0.5) * 1.5;
  let ndwi = (s.B03 - s.B08) / (s.B03 + s.B08);
  let msi = s.B11 / s.B08;
  let cired = s.B08 / s.B05 - 1.0;
  let redsi = (s.B08 - s.B05) / (s.B08 + s.B05 + s.B04 * 0.1);
  return {
    ndvi: [ndvi], ndmi: [ndmi], ndre: [ndre], evi: [evi], savi: [savi],
    ndwi: [ndwi], msi: [msi], cired: [cired], redsi: [redsi], dataMask: [1]
  };
}
`;

export const S1_EXTENDED_STATS_EVALSCRIPT = `
//VERSION=3
function setup() {
  return {
    input: ["VV", "VH"],
    output: [
      { id: "vh", bands: 1, sampleType: "FLOAT32" },
      { id: "vv", bands: 1, sampleType: "FLOAT32" },
      { id: "moisture", bands: 1, sampleType: "FLOAT32" },
      { id: "rvi", bands: 1, sampleType: "FLOAT32" },
      { id: "dprvi", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(s) {
  if (s.VV <= 0 || s.VH <= 0) {
    return { vh: [NaN], vv: [NaN], moisture: [NaN], rvi: [NaN], dprvi: [NaN], dataMask: [0] };
  }
  let ratio = s.VH / s.VV;
  let rvi = 4.0 * s.VH / (s.VV + s.VH);
  let beta = 0.347;
  let dprvi = (1.0 + beta * beta) * (s.VV + beta * s.VH) / Math.sqrt(Math.pow(beta * beta * s.VV + s.VH, 2) + beta * beta);
  return { vh: [s.VH], vv: [s.VV], moisture: [ratio], rvi: [rvi], dprvi: [dprvi], dataMask: [1] };
}
`;

export const S2_STATS_EVALSCRIPT = `
//VERSION=3
function setup() {
  return {
    input: ["B04", "B05", "B08", "B11", "SCL"],
    output: [
      { id: "ndvi", bands: 1, sampleType: "FLOAT32" },
      { id: "ndmi", bands: 1, sampleType: "FLOAT32" },
      { id: "ndre", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(s) {
  if (s.SCL >= 8 && s.SCL <= 10) {
    return { ndvi: [NaN], ndmi: [NaN], ndre: [NaN], dataMask: [0] };
  }
  let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04);
  let ndmi = (s.B08 - s.B11) / (s.B08 + s.B11);
  let ndre = (s.B08 - s.B05) / (s.B08 + s.B05);
  return { ndvi: [ndvi], ndmi: [ndmi], ndre: [ndre], dataMask: [1] };
}
`;

export const S2_GRID_EVALSCRIPT = `
//VERSION=3
function setup() {
  return {
    input: ["B04", "B08", "B11", "SCL"],
    output: [
      { id: "ndvi", bands: 1, sampleType: "FLOAT32" },
      { id: "ndmi", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(s) {
  if (s.SCL >= 8 && s.SCL <= 10) {
    return { ndvi: [NaN], ndmi: [NaN], dataMask: [0] };
  }
  let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04);
  let ndmi = (s.B08 - s.B11) / (s.B08 + s.B11);
  return { ndvi: [ndvi], ndmi: [ndmi], dataMask: [1] };
}
`;

export const S2_TRUE_COLOR_EVALSCRIPT = `
//VERSION=3
function setup() {
  return { input: ["B02", "B03", "B04", "SCL"], output: { bands: 3 } };
}
function evaluatePixel(s) {
  if (s.SCL >= 8 && s.SCL <= 10) return [0, 0, 0];
  return [2.5 * s.B04, 2.5 * s.B03, 2.5 * s.B02];
}
`;

export const S2_NDRE_COLOR_EVALSCRIPT = `
//VERSION=3
function setup() {
  return { input: ["B05", "B08", "SCL"], output: { bands: 3 } };
}
function evaluatePixel(s) {
  if (s.SCL >= 8 && s.SCL <= 10) return [0.1, 0.1, 0.1];
  let ndre = (s.B08 - s.B05) / (s.B08 + s.B05);
  if (ndre < 0.2) return [0.87, 0.27, 0.27];
  if (ndre < 0.35) return [0.92, 0.70, 0.03];
  if (ndre < 0.5) return [0.52, 0.80, 0.09];
  return [0.09, 0.64, 0.29];
}
`;

export const S2_NBR_EVALSCRIPT = `
//VERSION=3
function setup() {
  return { input: ["B08", "B12", "SCL"], output: { bands: 1, sampleType: "FLOAT32" } };
}
function evaluatePixel(s) {
  if (s.SCL >= 8 && s.SCL <= 10) return [NaN];
  return [(s.B08 - s.B12) / (s.B08 + s.B12)];
}
`;

/** REDSI — wheat yellow rust (optional profile). Not NDRE. */
export const S2_REDSI_EVALSCRIPT = `
//VERSION=3
function setup() {
  return { input: ["B04", "B05", "B08", "SCL"], output: { bands: 1, sampleType: "FLOAT32" } };
}
function evaluatePixel(s) {
  if (s.SCL >= 8 && s.SCL <= 10) return [NaN];
  return [(s.B08 - s.B05) / (s.B08 + s.B05 + s.B04 * 0.1)];
}
`;

export const S2_NDVI_COLOR_EVALSCRIPT = `
//VERSION=3
function setup() {
  return { input: ["B04", "B08", "SCL"], output: { bands: 3 } };
}
function evaluatePixel(s) {
  if (s.SCL >= 8 && s.SCL <= 10) return [0.1, 0.1, 0.1];
  let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04);
  if (ndvi < 0.2) return [0.87, 0.27, 0.27];
  if (ndvi < 0.4) return [0.92, 0.70, 0.03];
  if (ndvi < 0.6) return [0.52, 0.80, 0.09];
  return [0.09, 0.64, 0.29];
}
`;

export const S1_STATS_EVALSCRIPT = `
//VERSION=3
function setup() {
  return {
    input: ["VV", "VH"],
    output: [
      { id: "vh", bands: 1, sampleType: "FLOAT32" },
      { id: "vv", bands: 1, sampleType: "FLOAT32" },
      { id: "moisture", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(s) {
  if (s.VV <= 0 || s.VH <= 0) {
    return { vh: [NaN], vv: [NaN], moisture: [NaN], dataMask: [0] };
  }
  let ratio = s.VH / s.VV;
  return { vh: [s.VH], vv: [s.VV], moisture: [ratio], dataMask: [1] };
}
`;

export const S3_LST_EVALSCRIPT = `
//VERSION=3
function setup() {
  return {
    input: ["LST", "dataMask"],
    output: [
      { id: "lst", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(s) {
  if (s.dataMask === 0) {
    return { lst: [NaN], dataMask: [0] };
  }
  let celsius = s.LST - 273.15;
  return { lst: [celsius], dataMask: [1] };
}
`;
