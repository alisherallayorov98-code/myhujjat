#!/usr/bin/env bash
# MyHujjat.uz — Yangilash skripti
# Foydalanish: ./update.sh
#   yoki:       ./update.sh frontend       (faqat frontend)
#   yoki:       ./update.sh backend        (faqat backend)

set -euo pipefail

cd "$(dirname "$0")"

# Env'lardan kerakli o'zgaruvchilar
export DB_PASSWORD=$(grep "^DB_PASSWORD=" backend/.env.prod | cut -d= -f2)

if [ -z "$DB_PASSWORD" ]; then
  echo "✗ DB_PASSWORD topilmadi backend/.env.prod faylida"
  exit 1
fi

echo "▸ Git pull..."
git pull

SERVICE="${1:-}"
COMPOSE_FILE="docker-compose.test.yml"

if [ -n "$SERVICE" ]; then
  echo "▸ $SERVICE qayta yig'ilmoqda..."
  docker compose -f "$COMPOSE_FILE" up -d --build "$SERVICE"
else
  echo "▸ Hammasi qayta yig'ilmoqda..."
  docker compose -f "$COMPOSE_FILE" up -d --build
fi

echo ""
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "✅ Yangilandi"
echo "🌐 http://45.92.173.48:3100"
echo "📊 Loglar: docker compose -f $COMPOSE_FILE logs -f"
