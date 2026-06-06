import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('..', import.meta.url)));

function loadEnv() {
  for (const f of ['.env.local', '.env']) {
    const p = join(root, f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m && !process.env[m[1].trim()]) {
        process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
}

loadEnv();
const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const checks = [
  ['/api/health/data-pipeline', 'data pipeline'],
  ['/api/fields/import/template', 'csv template'],
];

let failed = 0;
for (const [path, label] of checks) {
  try {
    const res = await fetch(`${base}${path}`);
    if (!res.ok) {
      console.error(`✗ ${label}: HTTP ${res.status}`);
      failed += 1;
    } else {
      console.log(`✓ ${label}`);
      if (path.includes('template')) {
        const text = await res.text();
        if (!text.includes('Chacra Norte') || !text.includes('soybean')) {
          console.error('✗ csv template: faltan filas demo pequeña agricultora');
          failed += 1;
        } else {
          console.log('✓ csv template pequeña agricultora (5–8 ha)');
        }
      }
    }
  } catch (e) {
    console.error(`✗ ${label}: ${e instanceof Error ? e.message : e}`);
    failed += 1;
  }
}

const pages = ['/setup/parcel', '/setup/import', '/onboarding'];
for (const path of pages) {
  try {
    const res = await fetch(`${base}${path}`);
    if (res.ok || res.status === 307 || res.status === 308) {
      console.log(`✓ página ${path} responde`);
    } else {
      console.error(`✗ página ${path}: HTTP ${res.status}`);
      failed += 1;
    }
  } catch (e) {
    console.warn(`⚠ página ${path}: servidor no disponible (${e instanceof Error ? e.message : e})`);
  }
}

process.exit(failed > 0 ? 1 : 0);
