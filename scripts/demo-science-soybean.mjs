#!/usr/bin/env node
/**
 * Demo 5 min — Soja: scout NDRE → ML → campo → validación
 * Uso: node scripts/demo-science-soybean.mjs [APP_URL]
 */
const APP = process.argv[2] ?? process.env.APP_URL ?? 'http://localhost:3000';

async function step(label, fn) {
  console.log(`\n▶ ${label}`);
  await fn();
}

async function get(path) {
  const res = await fetch(`${APP}${path}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text, status: res.status };
  }
}

async function post(path, body) {
  const res = await fetch(`${APP}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function main() {
  console.log('Doctor Soya — Demo Science Lab (soja)');
  console.log('App:', APP);

  await step('1. Análisis multisensor soja (campo demo)', async () => {
    const data = await get('/api/science/soybean/analysis?fieldId=field-1&zoneId=zone-1');
    console.log('  Score reglas:', (data.fusionScore * 100).toFixed(0) + '%', data.healthLabel);
    console.log('  Score ML:', data.fusionScoreMl != null ? (data.fusionScoreMl * 100).toFixed(0) + '%' : '—');
    console.log('  NDRE:', data.optical?.ndre?.toFixed(3), 'DpRVI:', data.radar?.dpRvi?.toFixed(3));
    console.log('  Flags:', data.anomalyFlags?.join(', ') || 'ninguno');
  });

  await step('2. Registrar experimento', async () => {
    const data = await post('/api/science/experiments', {
      crop: 'soybean',
      fieldId: 'field-1',
      zoneId: 'zone-1',
      hypothesis: 'Demo: NDRE precede NDVI en estrés temprano',
    });
    console.log('  Guardado:', data.ok ? 'sí' : 'no (mock OK)');
  });

  await step('3. Etiqueta validación campo', async () => {
    const data = await post('/api/science/validation', {
      fieldId: 'field-1',
      crop: 'soybean',
      diseaseLabel: 'Asian Soybean Rust (sospecha)',
      severity: 'low',
      notes: 'Demo script — confirmar en parcela',
    });
    console.log('  Validación:', data.ok ? 'registrada' : data.error ?? 'mock');
  });

  await step('4. Serie temporal 90d', async () => {
    const data = await get('/api/science/soybean/timeseries?fieldId=field-1&zoneId=zone-1&days=90');
    console.log('  Puntos:', data.series?.length ?? 0);
  });

  console.log('\n✓ Demo completa. Abre /science/soybean y /monitor?field=field-1');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
