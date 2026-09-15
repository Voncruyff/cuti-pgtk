# ==============================================================================
# Dockerfile - SIP-CUTI PG Trangkil (Next.js 15 Standalone + Prisma 5)
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Base Image: Alpine Linux dengan Node.js 20 & OpenSSL untuk Prisma
# ------------------------------------------------------------------------------
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl netcat-openbsd

# ------------------------------------------------------------------------------
# 2. Dependencies: Menginstal paket npm yang dibutuhkan
# ------------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci

# ------------------------------------------------------------------------------
# 3. Builder: Build aplikasi Next.js dalam mode standalone
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generate Prisma Client & Kompilasi Next.js Standalone
RUN npx prisma generate
RUN npm run build

# ------------------------------------------------------------------------------
# 4. Runner: Image runtime produksi minimalis (~150-200 MB)
# ------------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install tools untuk entrypoint & dependency yang dibutuhkan seed
RUN npm install -g prisma@5.22.0 tsx@4.19.2
RUN npm install --no-save bcryptjs@2.4.3

# Membuat user non-root demi standar keamanan
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Salin aset statis & hasil build standalone Next.js
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Siapkan direktori uploads dengan hak akses nextjs
RUN mkdir -p /app/public/uploads/profile /app/uploads/profile && chown -R nextjs:nodejs /app/public/uploads /app/uploads

# Salin skrip entrypoint
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
