#!/usr/bin/env bash
set -euo pipefail
cd /opt/aura-agro
SECRET=$(sed -n 's/^CRON_SECRET=//p' .env | head -1)
test -n "$SECRET"
curl -sS -m 300 -w "\nHTTP:%{http_code}\n" \
  -H "Authorization: Bearer ${SECRET}" \
  "https://hackathon.aura.ia.bo/api/cron/fetch-metrics?job=all"
