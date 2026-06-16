#!/bin/bash
set -e

echo "🎟️  Configurando Sistema de Pases..."
echo ""

# Backend
echo "📦 Instalando dependencias del backend..."
cd backend
npm install
cd ..

# Web
echo "📦 Instalando dependencias del web..."
cd web
npm install
cd ..

# Mobile
echo "📦 Instalando dependencias del mobile..."
cd mobile
npm install
cd ..

# .env del backend
if [ ! -f "backend/.env" ]; then
  cp backend/.env.example backend/.env
  echo "✅ Creado backend/.env (editalo con tus credenciales)"
fi

# .env del mobile
if [ ! -f "mobile/.env" ]; then
  cp mobile/.env.example mobile/.env
  echo "✅ Creado mobile/.env"
fi

# Generar cliente de Prisma y migrar DB
echo "🗄️  Inicializando base de datos..."
cd backend
npx prisma generate
npx prisma migrate dev --name init --skip-seed
cd ..

echo ""
echo "✅ ¡Todo listo!"
echo ""
echo "Para iniciar el backend:    cd backend && npm run dev"
echo "Para iniciar el web:        cd web && npm run dev"
echo "Para iniciar la app mobile: cd mobile && npm start"
