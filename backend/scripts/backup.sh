#!/bin/bash
# MyHujjat.uz database avto-backup script
#
# Ishlash:
#   chmod +x scripts/backup.sh
#   crontab -e
#   0 3 * * * /opt/myhujjat/backend/scripts/backup.sh >> /var/log/myhujjat-backup.log 2>&1
#
# Sozlamalar:
#   .env'da DATABASE_URL bo'lishi kerak
#   BACKUP_DIR — bo'lmasa /var/backups/myhujjat
#   BACKUP_RETENTION_DAYS — bo'lmasa 30 kun
#   AWS S3 (optional): AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

set -euo pipefail

# .env yuklash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
[ -f "$BACKEND_DIR/.env" ] && set -a && source "$BACKEND_DIR/.env" && set +a

# Sozlamalar
BACKUP_DIR="${BACKUP_DIR:-/var/backups/myhujjat}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/myhujjat_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# DATABASE_URL'dan host/db/user ajratish
# Format: postgresql://USER:PASSWORD@HOST:PORT/DB?...
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL topilmadi"
  exit 1
fi

echo "[$(date)] Backup boshlanmoqda → $BACKUP_FILE"

# pg_dump + gzip
pg_dump --no-owner --no-acl --clean --if-exists "$DATABASE_URL" | gzip -9 > "$BACKUP_FILE"

# Hajmni ko'rsatish
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup tugadi: $SIZE"

# Eski backuplarni o'chirish
echo "[$(date)] $RETENTION_DAYS kundan eski fayllar o'chirilmoqda..."
find "$BACKUP_DIR" -name "myhujjat_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

# AWS S3'ga yuklash (ixtiyoriy)
if [ -n "${AWS_S3_BUCKET:-}" ]; then
  echo "[$(date)] S3'ga yuklanmoqda: s3://$AWS_S3_BUCKET/backups/"
  aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BUCKET/backups/" --storage-class STANDARD_IA
fi

echo "[$(date)] ✓ Backup muvaffaqiyatli tugadi"
