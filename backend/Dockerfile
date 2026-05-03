# ─── Build stage ─────────────────────────────────────────
FROM node:20-alpine AS builder
# OpenSSL va libc compat — Prisma uchun majburiy
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npx prisma generate
RUN npm run build

# ─── Runtime stage ───────────────────────────────────────
FROM node:20-alpine
# Runtime'da ham OpenSSL kerak — Prisma engine uchun
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/dist           ./dist
COPY --from=builder /app/node_modules   ./node_modules
COPY --from=builder /app/prisma         ./prisma
COPY --from=builder /app/package.json   ./

EXPOSE 4000

# Versionlangan migratsiyalar (xavfsiz — DROP TABLE qilmaydi)
# Lokal/dev'da `prisma migrate dev` bilan migration yaratiladi,
# prod'da faqat `migrate deploy` qo'llanadi.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
