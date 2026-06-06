/** Credenciales demo insertadas por docker/postgres/init/02-seed.sql */

export const DEMO_PASSWORD = 'demo123456';

export const DEMO_USERS = [
  { email: 'admin@doctorsoya.app', role: 'owner', label: 'Cooperativa (piloto BID)' },
  { email: 'maria@doctorsoya.app', role: 'owner', label: 'Pequeña agricultora (19 ha)' },
  { email: 'analista@doctorsoya.app', role: 'admin', label: 'Analista' },
  { email: 'campo@doctorsoya.app', role: 'viewer', label: 'Campo (solo lectura)' },
];

export function printDemoCredentials() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  Doctor Soya — usuarios demo (creados al iniciar DB)');
  console.log('══════════════════════════════════════════════════');
  console.log(`  Contraseña para todos: ${DEMO_PASSWORD}\n`);
  for (const u of DEMO_USERS) {
    console.log(`  • ${u.email.padEnd(28)} (${u.role}) — ${u.label}`);
  }
  console.log('\n  Login: http://localhost:3000/login');
  console.log('  Postgres: localhost:5433  |  MinIO: http://localhost:9001');
  console.log('══════════════════════════════════════════════════\n');
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('demo-credentials.mjs')) {
  printDemoCredentials();
}
