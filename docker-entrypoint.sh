#!/bin/sh
set -e

# Detect database provider and normalize DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
  echo "[ENTRYPOINT] Analyzing DATABASE_URL configuration..."
  
  if echo "$DATABASE_URL" | grep -qE '^postgres(ql)?://'; then
    echo "[ENTRYPOINT] Detected PostgreSQL connection string. Switching Prisma datasource to postgresql..."
    sed -i 's/provider = "sqlite"/provider = "postgresql"/' ./prisma/schema.prisma
    npx prisma generate
    npx prisma db push --skip-generate || echo "[WARN] Prisma db push failed, continuing startup..."
  else
    # SQLite mode
    echo "[ENTRYPOINT] Detected SQLite database."
    if ! echo "$DATABASE_URL" | grep -q '^file:'; then
      export DATABASE_URL="file:${DATABASE_URL}"
    fi
    npx prisma db push --skip-generate || echo "[WARN] Prisma db push failed, continuing startup..."
  fi
else
  echo "[ENTRYPOINT] No DATABASE_URL specified. Defaulting to local SQLite file:./prisma/dev.db..."
  export DATABASE_URL="file:./prisma/dev.db"
  npx prisma db push --skip-generate || echo "[WARN] Prisma db push failed, continuing startup..."
fi

echo "[ENTRYPOINT] Launching Next.js on port ${PORT:-3050}..."
exec "$@"
