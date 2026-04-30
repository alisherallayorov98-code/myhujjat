#!/bin/bash
# MyHujjat.uz database backup'dan tiklash script
#
# Ishlash:
#   ./scripts/restore.sh /var/backups/myhujjat/myhujjat_20260428_030000.sql.gz

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
[ -f "$BACKEND_DIR/.env" ] && set -a && source "$BACKEND_DIR/.env" && set +a

if [ $# -eq 0 ]; then
  echo "Foydalanish: $0 <backup-fayl.sql.gz>"
  echo "Mavjud backuplar:"
  ls -lh /var/backups/myhujjat/myhujjat_*.sql.gz 2>/dev/null | tail -10 || echo "  (backuplar topilmadi)"
  exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Fayl topilmadi: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  DIQQAT: Bu amal mavjud database'ni butunlay almashtiradi!"
echo "Database: $DATABASE_URL"
echo "Backup:   $BACKUP_FILE"
read -p "Davom etishni xohlaysizmi? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Bekor qilindi."
  exit 1
fi

echo "[$(date)] Backup tiklanmoqda..."
gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
echo "[$(date)] ✓ Backup muvaffaqiyatli tiklandi"
