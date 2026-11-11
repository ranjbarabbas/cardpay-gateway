FROM node:20-slim AS base

RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# -------------------------------------------------------------
# Stage 1: Dependencies
# -------------------------------------------------------------
FROM base AS deps
WORKDIR /app

ENV NODE_ENV=development

# Universal context handler: works whether build context is repo root or /backend
COPY . .
RUN if [ -f "./backend/package.json" ]; then \
      cp ./backend/package*.json ./ && \
      if [ -d "./backend/prisma" ]; then cp -r ./backend/prisma ./; fi; \
    fi && \
    npm ci --include=dev --no-audit --no-fund --prefer-offline || \
    npm install --include=dev --no-audit --no-fund

# -------------------------------------------------------------
# Stage 2: Builder
# -------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Universal context handler for build
RUN if [ -d "./backend" ] && [ -f "./backend/package.json" ]; then \
      cp -r ./backend/* ./; \
    fi && \
    if [ ! -f /app/system_settings.json ]; then \
      echo "{}" > /app/system_settings.json; \
    fi && \
    if [ ! -f /app/docker-entrypoint.sh ]; then \
      if [ -f /app/backend/docker-entrypoint.sh ]; then \
        cp /app/backend/docker-entrypoint.sh /app/docker-entrypoint.sh; \
      fi; \
    fi && \
    chmod +x /app/docker-entrypoint.sh 2>/dev/null || true && \
    npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# -------------------------------------------------------------
# Stage 3: Runner
# -------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3050
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/system_settings.json ./system_settings.json
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3050

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
