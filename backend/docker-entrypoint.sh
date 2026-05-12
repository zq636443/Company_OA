#!/bin/sh
set -e

npx prisma db push

if [ "${SEED_ON_START:-true}" = "true" ]; then
  npm run db:seed
fi

exec node dist/main.js
