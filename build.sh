#!/bin/sh
set -e

if [ "$RAILWAY_SERVICE_NAME" = "web" ]; then
  echo "Building web..."
  cd web
  npm install
  npm run build
else
  echo "Building backend..."
  cd backend
  npm install
  node_modules/.bin/prisma generate
  node_modules/.bin/tsc
fi
