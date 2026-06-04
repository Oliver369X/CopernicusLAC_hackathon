import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

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

const dbUrl = process.env.DATABASE_URL;
let failed = 0;

async function checkDb() {
  if (!dbUrl) {
    console.warn('⊘ DATABASE_URL no definido — omitiendo checks SQL');
    return;
  }
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  try {
    const orgs = await client.query(
      `SELECT o.id, o.name,
        (SELECT COUNT(*) FROM fields f WHERE f.org_id = o.id) AS fields_count
       FROM organizations o ORDER BY o.created_at DESC LIMIT 20`
    );

    for (const org of orgs.rows) {
      const orgId = org.id;
      if (Number(org.fields_count) === 0) {
        console.error(`✗ org ${org.name}: sin campos`);
        failed += 1;
        continue;
      }

      const zones = await client.query(
        `SELECT COUNT(z.id)::int AS total,
          COUNT(DISTINCT sr.zone_id)::int AS with_sat
         FROM zones z
         JOIN fields f ON f.id = z.field_id
         LEFT JOIN satellite_readings sr ON sr.zone_id = z.id
         WHERE f.org_id = $1`,
        [orgId]
      );
      const total = zones.rows[0]?.total ?? 0;
      const withSat = zones.rows[0]?.with_sat ?? 0;
      const pct = total > 0 ? Math.round((withSat / total) * 100) : 0;

      const insights = await client.query(
        `SELECT COUNT(*)::int AS n FROM zone_insights zi
         JOIN zones z ON z.id = zi.zone_id
         JOIN fields f ON f.id = z.field_id
         WHERE f.org_id = $1`,
        [orgId]
      );
      const narr = insights.rows[0]?.n ?? 0;

      if (pct < 50 && total > 0) {
        console.warn(`⚠ ${org.name}: satélite ${pct}% (${withSat}/${total})`);
      } else {
        console.log(`✓ ${org.name}: satélite ${pct}% · narrativas ${narr}`);
      }
    }
  } finally {
    await client.end();
  }
}

const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
for (const path of ['/api/health', '/api/health/data-pipeline']) {
  try {
    const res = await fetch(`${base}${path}`);
    if (!res.ok) {
      console.error(`✗ ${path}: HTTP ${res.status}`);
      failed += 1;
    } else {
      console.log(`✓ ${path}`);
    }
  } catch (e) {
    console.error(`✗ ${path}: ${e instanceof Error ? e.message : e}`);
    failed += 1;
  }
}

await checkDb();
process.exit(failed > 0 ? 1 : 0);
