#!/usr/bin/env bash
set -euo pipefail
cd /opt/aura-agro
export COMPOSE="docker compose -f docker-compose.yml -f docker-compose.hackathon.yml"

echo "=== Extract SJ seed block ==="
awk '/-- SJ_SEED_START/{p=1;next} /-- PF_SEED_START/{p=0} p' docker/postgres/init/02-seed.sql > /tmp/sj-seed.sql

echo "=== Apply SJ fields/zones/alerts ==="
$COMPOSE exec -T postgres psql -U doctorsoya -d doctorsoya < /tmp/sj-seed.sql || true

echo "=== Satellite + climate ==="
$COMPOSE exec -T postgres psql -U doctorsoya -d doctorsoya < docker/postgres/init/05-seed-satellite-climate.sql || true

echo "=== Geodata links ==="
$COMPOSE exec -T postgres psql -U doctorsoya -d doctorsoya < docker/postgres/init/09-geodata-links.sql || true

echo "=== Verify ==="
$COMPOSE exec -T postgres psql -U doctorsoya -d doctorsoya -c \
  "SELECT id FROM fields WHERE id LIKE 'field-sj-%' OR id LIKE 'field-pf-%' ORDER BY id;"
$COMPOSE exec -T postgres psql -U doctorsoya -d doctorsoya -c \
  "SELECT field_id, external_id FROM field_external_ids ORDER BY field_id;"
