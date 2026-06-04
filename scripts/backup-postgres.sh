#!/usr/bin/env bash
# Backup diario Postgres — cron VPS ejemplo:
# 0 3 * * * /opt/doctor-soya/scripts/backup-postgres.sh >> /var/log/pg-backup.log 2>&1
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/doctor-soya}"
RETAIN_DAYS="${RETAIN_DAYS:-14}"
mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/doctor_soya_${STAMP}.sql.gz"
if [ -f "$DIR/.env" ]; then set -a; source "$DIR/.env"; set +a; fi
: "${DATABASE_URL:?DATABASE_URL required}"
pg_dump "$DATABASE_URL" | gzip -9 > "$FILE"
find "$BACKUP_DIR" -name 'doctor_soya_*.sql.gz' -mtime +"$RETAIN_DAYS" -delete
echo "OK $FILE"
