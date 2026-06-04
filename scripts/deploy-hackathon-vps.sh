#!/usr/bin/env bash
# Run ON THE VPS at /opt/aura-agro after git pull (blocks V0–V14).
set -euo pipefail

export COMPOSE="docker compose -f docker-compose.yml -f docker-compose.hackathon.yml"
export BASE="https://hackathon.aura.ia.bo"

cd /opt/aura-agro

echo "=== V0.4 VPS_SHA_BEFORE ==="
VPS_SHA_BEFORE=$(git rev-parse HEAD)
echo "$VPS_SHA_BEFORE"

echo "=== V1 Backup ==="
sudo mkdir -p /var/backups/doctor-soya
sudo chown "$USER:$USER" /var/backups/doctor-soya 2>/dev/null || true
BACKUP="/var/backups/doctor-soya/pre-bid-$(date +%Y%m%d_%H%M).sql.gz"
$COMPOSE exec -T postgres pg_dump -U doctorsoya doctorsoya | gzip -9 > "$BACKUP"
ls -lh "$BACKUP"
gzip -t "$BACKUP"

echo "=== V2 Baseline ==="
$COMPOSE exec -T postgres psql -U doctorsoya -d doctorsoya -c \
  "SELECT (SELECT COUNT(*) FROM fields) AS fields, (SELECT COUNT(*) FROM zones) AS zones,
   (SELECT COUNT(*) FROM satellite_readings) AS sat_readings, (SELECT COUNT(*) FROM users) AS users;"

echo "=== V3 SQL 03 ==="
$COMPOSE exec -T postgres psql -U doctorsoya -d doctorsoya < docker/postgres/init/03-mvp-migrations.sql
$COMPOSE exec -T postgres psql -U doctorsoya -d doctorsoya -c \
  "SELECT tablename FROM pg_tables WHERE schemaname='public'
   AND tablename IN ('zone_insights','import_jobs','invites','notification_rules','member_zone_assignments','cron_runs');"

echo "=== V4 SQL 04 ==="
$COMPOSE exec -T postgres psql -U doctorsoya -d doctorsoya < docker/postgres/init/04-zone-bounds-backfill.sql
$COMPOSE exec -T postgres psql -U doctorsoya -d doctorsoya -c \
  "SELECT COUNT(*) FILTER (WHERE bounds IS NOT NULL AND bounds::text <> '{}') AS ok, COUNT(*) AS total FROM zones;"

echo "=== V5 Git pull ==="
git fetch origin
git pull origin main
LOCAL_EXPECT="${LOCAL_SHA:-}"
if [ -n "$LOCAL_EXPECT" ]; then
  test "$(git rev-parse HEAD)" = "$LOCAL_EXPECT" || { echo "SHA mismatch"; exit 1; }
fi
test -f app/invite/[token]/page.tsx
grep -q narrative-batch worker/index.mjs

echo "=== V7 Build ==="
$COMPOSE build web worker worker-queue

echo "=== V8 Up ==="
$COMPOSE up -d
sleep 45
$COMPOSE ps

echo "=== V9 Health ==="
curl -sS "$BASE/api/health" | grep -q '"ok":true'

echo "=== V10 Cron ==="
export CRON_SECRET=$(grep '^CRON_SECRET=' .env | cut -d= -f2-)
test -n "$CRON_SECRET"
curl -sS -H "Authorization: Bearer $CRON_SECRET" "$BASE/api/cron/fetch-metrics?job=all" | tee /tmp/cron-all.json | grep -q narrativeBatch
$COMPOSE exec -T postgres psql -U doctorsoya -d doctorsoya -c \
  "SELECT job_name, status FROM cron_runs ORDER BY finished_at DESC LIMIT 5;"

echo "=== V11 Worker ==="
$COMPOSE logs worker --tail=40 | grep -E 'status=200' || true

echo "=== V14 verify-pilot ==="
export NEXT_PUBLIC_APP_URL="$BASE"
node scripts/verify-pilot.mjs

echo "=== DONE VPS_SHA_AFTER ==="
git rev-parse HEAD
echo "Deploy script finished OK"
