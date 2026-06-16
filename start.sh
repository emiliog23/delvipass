#!/bin/sh
set -e

if [ "$RAILWAY_SERVICE_NAME" = "web" ]; then
  echo "Starting web..."
  cd web
  node_modules/.bin/serve -s dist -l ${PORT:-3001}
else
  echo "Starting backend..."
  cd backend
  node_modules/.bin/prisma migrate deploy
  node dist/index.js
fi
