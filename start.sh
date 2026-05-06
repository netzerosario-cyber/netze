#!/bin/bash
# ============================================================
# start.sh — Arranque seguro de Netze
# Uso: ./start.sh
# ============================================================

echo "🚀 Iniciando Netze..."

# 1. Matar cualquier proceso en el puerto 3000
PIDS=$(lsof -ti:3000 2>/dev/null)
if [ -n "$PIDS" ]; then
  echo "⚠️  Puerto 3000 ocupado — liberando..."
  echo "$PIDS" | xargs kill -9 2>/dev/null
  sleep 1
fi

# 2. Verificar que node_modules existe
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependencias..."
  npm install
fi

# 3. Arrancar el servidor
echo "✅ Arrancando servidor en http://localhost:3000"
npm run dev
