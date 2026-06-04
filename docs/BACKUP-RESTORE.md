# Backup y restauración Postgres

## Backup diario (VPS)

```bash
chmod +x scripts/backup-postgres.sh
BACKUP_DIR=/var/backups/doctor-soya ./scripts/backup-postgres.sh
```

Cron sugerido: `0 3 * * *` con `DATABASE_URL` en `.env`.

## Restaurar

```bash
gunzip -c /var/backups/doctor-soya/doctor_soya_YYYYMMDD_HHMMSS.sql.gz | psql "$DATABASE_URL"
```

Probar en staging antes de tocar producción.

## Verificación

Tras restore: `pnpm verify:pilot` y login de una org piloto.
