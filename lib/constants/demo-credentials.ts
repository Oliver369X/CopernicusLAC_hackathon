/** Usuarios insertados por docker/postgres/init/02-seed.sql al levantar la DB */

export const DEMO_PASSWORD = 'demo123456';

export const DEMO_USERS = [
  { email: 'admin@doctorsoya.app', role: 'owner', label: 'Cooperativa (piloto BID)' },
  { email: 'maria@doctorsoya.app', role: 'owner', label: 'Pequeña agricultora (19 ha)' },
  { email: 'lucia@doctorsoya.app', role: 'owner', label: 'Lucía — chacra 10 ha (hist. 3 años)' },
  { email: 'rosa@doctorsoya.app', role: 'owner', label: 'Rosa — cooperativa 500 ha (hist. 3 años)' },
  { email: 'analista@doctorsoya.app', role: 'admin', label: 'Analista' },
  { email: 'campo@doctorsoya.app', role: 'viewer', label: 'Campo' },
] as const;

export const SHOW_DEMO_CREDENTIALS =
  process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === 'true';
