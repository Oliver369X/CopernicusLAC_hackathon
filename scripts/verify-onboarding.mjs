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
    }
  } catch (e) {
    console.error(`✗ ${label}: ${e instanceof Error ? e.message : e}`);
    failed += 1;
  }
}

process.exit(failed > 0 ? 1 : 0);
