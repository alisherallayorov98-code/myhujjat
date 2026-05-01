# ─── Build stage ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Dependencies (cached layer)
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Build
COPY . .
# .env.prod ni Next.js standart joyiga ko'chirish — build paytida NEXT_PUBLIC_* o'qish uchun
RUN [ -f .env.prod ] && cp .env.prod .env.production || true
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── Runtime stage ───────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Standalone output — minimal kerakli fayllar
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
