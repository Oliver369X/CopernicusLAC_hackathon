#!/usr/bin/env bash
set -euo pipefail
cd /opt/aura-agro
SECRET=$(sed -n 's/^CRON_SECRET=//p' .env | head -1)
curl -sS -m 120 -H "Authorization: Bearer ${SECRET}" \
  "https://hackathon.aura.ia.bo/api/cron/fetch-metrics?job=narrative-batch"
echo
docker compose -f docker-compose.yml -f docker-compose.hackathon.yml exec -T postgres \
  psql -U doctorsoya -d doctorsoya -c 'SELECT COUNT(*) FROM zone_insights;'
