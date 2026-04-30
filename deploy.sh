#!/usr/bin/env bash
# MyHujjat.uz — VPS uchun avtomatik deploy script
# Foydalanish: bash deploy.sh

set -euo pipefail

# ─── Ranglar ────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
log()  { echo -e "${GREEN}▸${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
err()  { echo -e "${RED}✗${NC} $1"; exit 1; }

# ─── Docker o'rnatilganmi? ──────────────────────────────
if ! command -v docker &> /dev/null; then
  log "Docker o'rnatilmoqda..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
  warn "Docker o'rnatildi. SSH'dan chiqib qayta kiring va shu skriptni qayta ishga tushiring!"
  exit 0
fi

if ! docker compose version &> /dev/null; then
  log "Docker Compose plugin o'rnatilmoqda..."
  sudo apt-get update -qq
  sudo apt-get install -y docker-compose-plugin
fi

# ─── Loyiha papkasiga o'tish ────────────────────────────
cd "$(dirname "$0")"

# ─── .env.prod fayllar borligini tekshirish ─────────────
if [ ! -f backend/.env.prod ]; then
  err "backend/.env.prod fayli topilmadi!"
fi
if [ ! -f frontend/.env.prod ]; then
  err "frontend/.env.prod fayli topilmadi!"
fi

# ─── Sirlarni avtomatik yaratish (agar CHANGE_ME bo'lsa) ─
if grep -q "CHANGE_ME" backend/.env.prod; then
  log "Sirlar yaratilmoqda..."
  DB_PASS=$(openssl rand -hex 16)
  JWT_SEC=$(openssl rand -hex 32)
  JWT_REF=$(openssl rand -hex 32)
  ENC_KEY=$(openssl rand -hex 32)

  # VAPID kalitlari
  if command -v node &> /dev/null && [ -d backend/node_modules/web-push ]; then
    VAPID=$(node -e "const wp=require('./backend/node_modules/web-push');const k=wp.generateVAPIDKeys();console.log(k.publicKey+':'+k.privateKey)")
    VAPID_PUB="${VAPID%:*}"
    VAPID_PRIV="${VAPID#*:}"
  else
    # Vaqtinchalik placeholder — VAPID node modul'ga muhtoj
    VAPID_PUB="PLACEHOLDER_GENERATE_LATER"
    VAPID_PRIV="PLACEHOLDER_GENERATE_LATER"
    warn "VAPID kalitlari hozir avtomatik yaratilmadi (deploy keyin yaratiladi)"
  fi

  # Sed bilan almashtirish
  sed -i "s|CHANGE_ME_DB_PASSWORD|${DB_PASS}|g"               backend/.env.prod
  sed -i "s|CHANGE_ME_JWT_SECRET_64_CHARS_MINIMUM|${JWT_SEC}|g" backend/.env.prod
  sed -i "s|CHANGE_ME_JWT_REFRESH_SECRET_64_CHARS_MINIMUM|${JWT_REF}|g" backend/.env.prod
  sed -i "s|CHANGE_ME_64_HEX_CHARS|${ENC_KEY}|g"              backend/.env.prod
  sed -i "s|CHANGE_ME_VAPID_PUBLIC|${VAPID_PUB}|g"            backend/.env.prod
  sed -i "s|CHANGE_ME_VAPID_PRIVATE|${VAPID_PRIV}|g"          backend/.env.prod

  log "Sirlar yaratildi va backend/.env.prod ga yozildi"
fi

# ─── DB_PASSWORD ni docker-compose ga uzatish ──────────
export DB_PASSWORD=$(grep "^DB_PASSWORD=" backend/.env.prod | cut -d= -f2)
export NEXT_PUBLIC_API_URL=$(grep "^NEXT_PUBLIC_API_URL=" frontend/.env.prod | cut -d= -f2)

# ─── Build & Run ────────────────────────────────────────
log "Docker image'lar yig'ilmoqda (5-10 daqiqa)..."
docker compose -f docker-compose.prod.yml build --no-cache

log "Container'lar ishga tushirilmoqda..."
docker compose -f docker-compose.prod.yml up -d

# ─── Holatni ko'rsatish ─────────────────────────────────
sleep 5
log "Container'lar holati:"
docker compose -f docker-compose.prod.yml ps

echo ""
log "✅ Deploy muvaffaqiyatli!"
echo ""
echo "  🌐 Sayt: https://myhujjat-45-92-173-48.sslip.io"
echo "  📊 Loglar: docker compose -f docker-compose.prod.yml logs -f"
echo "  🔄 Qayta yuklash: docker compose -f docker-compose.prod.yml restart"
echo "  🛑 To'xtatish: docker compose -f docker-compose.prod.yml down"
echo ""
warn "Birinchi marta — Caddy SSL sertifikatini Let's Encrypt'dan oladi (~30 soniya)"
