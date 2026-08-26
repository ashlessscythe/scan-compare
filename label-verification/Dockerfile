ARG NODE_VERSION=22-slim

FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Skip postinstall (prisma generate) — schema is not copied yet
RUN npm ci --ignore-scripts

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# prisma generate runs as part of npm run build
RUN npm run build

FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma migrations: install CLI with full dependency tree (not cherry-picked)
COPY --from=builder /app/prisma ./prisma
RUN mkdir -p /opt/prisma-cli \
  && cd /opt/prisma-cli \
  && npm init -y \
  && npm install prisma@6.19.3 --omit=dev \
  && chown -R nextjs:nodejs /opt/prisma-cli /app/prisma

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
