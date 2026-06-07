#!/usr/bin/env bash
# Patch /opt/aura-agro/.env for hackathon prod + geo-data. Run on VPS as root.
set -euo pipefail
ENV_FILE=/opt/aura-agro/.env
GEODATA_KEY="${1:?usage: patch-hackathon-env.sh GEODATA_API_KEY}"

upsert() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
  else
    echo "${key}=${val}" >> "$ENV_FILE"
  fi
}

upsert DOMAIN hackathon.aura.ia.bo
upsert NEXT_PUBLIC_APP_URL https://hackathon.aura.ia.bo
upsert APP_URL https://hackathon.aura.ia.bo
upsert NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS true
upsert GEODATA_ENABLED true
upsert GEODATA_BASE_URL http://34.63.197.152:8002
upsert GEODATA_API_KEY "$GEODATA_KEY"

echo "ENV patched OK"
