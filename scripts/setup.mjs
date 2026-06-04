import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout } from 'node:timers/promises';
import { printDemoCredentials } from './demo-credentials.mjs';

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

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log('Doctor Soya — setup inicial\n');

const envPath = join(root, '.env');
const envLocalPath = join(root, '.env.local');

if (!existsSync(envPath) && !existsSync(envLocalPath)) {
  copyFileSync(join(root, '.env.local.example'), envPath);
  console.log('✓ Creado .env desde .env.local.example\n');
} else {
  console.log('✓ .env ya existe, no se sobrescribe\n');
}

console.log('Levantando Postgres + MinIO (Docker)...\n');
run('docker', ['compose', 'up', 'postgres', 'minio', 'minio-init', '-d']);

console.log('Esperando Postgres...');
for (let i = 0; i < 30; i++) {
  const check = spawnSync(
    'docker',
    ['compose', 'exec', '-T', 'postgres', 'pg_isready', '-U', 'doctorsoya', '-d', 'doctorsoya'],
    { cwd: root, stdio: 'pipe', shell: true }
  );
  if (check.status === 0) break;
  await setTimeout(1000);
}

printDemoCredentials();
loadEnv();

const hasCopernicus =
  process.env.COPERNICUS_CLIENT_ID && process.env.COPERNICUS_CLIENT_SECRET;
if (hasCopernicus) {
  console.log('\nEjecutando sincronización satelital (puede tardar)…\n');
  const sat = spawnSync('node', ['scripts/cron-once.mjs', 'satellite'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  if (sat.status === 0) {
    console.log('✓ Satélite: OK\n');
    spawnSync('node', ['scripts/backfill-satellite.mjs', '30'], {
      cwd: root,
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });
  } else {
    console.log('⚠ Satélite: error (revisá credenciales Copernicus)\n');
  }
} else {
  console.log('\n⊙ Satélite: omitido (sin COPERNICUS_CLIENT_ID/SECRET en .env)\n');
}

console.log('Siguiente paso: pnpm dev\n');
console.log('Datos reales: pnpm cron:satellite && pnpm cron:backfill\n');
