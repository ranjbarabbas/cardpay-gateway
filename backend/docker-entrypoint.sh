#!/bin/sh
set -e

# Run Prisma schema synchronization on container start if DATABASE_URL is configured
if [ -n "$DATABASE_URL" ]; then
  echo "[ENTRYPOINT] Synchronizing Prisma database schema..."
  npx prisma db push --skip-generate || echo "[WARN] Prisma db push failed, continuing startup..."
fi

echo "[ENTRYPOINT] Launching Next.js on port ${PORT:-3050}..."
exec "$@"
