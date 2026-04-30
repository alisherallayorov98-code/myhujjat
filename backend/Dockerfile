# ─── Build stage ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npx prisma generate
RUN npm run build

# ─── Runtime stage ───────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/dist           ./dist
COPY --from=builder /app/node_modules   ./node_modules
COPY --from=builder /app/prisma         ./prisma
COPY --from=builder /app/package.json   ./

EXPOSE 4000

# Migratsiyani avtomatik qo'llash, keyin ishga tushirish
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/main"]
