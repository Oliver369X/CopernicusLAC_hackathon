#!/usr/bin/env bash
set -euo pipefail
cd /opt/aura-agro
export COMPOSE="docker compose -f docker-compose.yml -f docker-compose.hackathon.yml"

upsert() {
  local key="$1" val="$2"
  if grep -q "^${key}=" .env; then
    sed -i "s|^${key}=.*|${key}=${val}|" .env
  else
    echo "${key}=${val}" >> .env
  fi
}

upsert DOMAIN hackathon.aura.ia.bo
upsert NEXT_PUBLIC_APP_URL https://hackathon.aura.ia.bo
upsert APP_URL https://hackathon.aura.ia.bo
upsert GEODATA_ENABLED true
upsert GEODATA_BASE_URL http://34.63.197.152:8002
upsert GEODATA_API_KEY aura-mvp-v2-test-key

echo "=== SQL geodata links + maria seed ==="
$COMPOSE exec -T postgres psql -U doctorsoya -d doctorsoya < docker/postgres/init/09-geodata-links.sql || true
$COMPOSE exec -T postgres psql -U doctorsoya -d doctorsoya < scripts/seed-small-farmer-prod.sql || true
$COMPOSE exec -T postgres psql -U doctorsoya -d doctorsoya < scripts/seed-personas-3y-prod.sql || true

if [[ "${SEED_DEMO_OVERLAY:-0}" == "1" ]]; then
  echo "=== Seed overlay demo 3y (opt-in SEED_DEMO_OVERLAY=1) ==="
  $COMPOSE exec -T postgres psql -U doctorsoya -d doctorsoya < scripts/seed-personas-3y-overlay.sql || true
fi

echo "=== Build ==="
$COMPOSE build web worker worker-queue

echo "=== Up ==="
$COMPOSE up -d
sleep 50
$COMPOSE ps

echo "=== Health ==="
curl -sS https://hackathon.aura.ia.bo/api/health
echo
curl -sS https://hackathon.aura.ia.bo/api/integrations/geodata/health
echo
echo "=== DONE $(git rev-parse --short HEAD) ==="
