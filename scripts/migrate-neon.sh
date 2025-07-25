#!/bin/bash
# Script de migração automática para Neon.tech

echo "🚀 Iniciando migração para Neon.tech PostgreSQL"

# Verificar se connection string foi fornecida
if [ -z "$1" ]; then
  echo "❌ Erro: Connection string não fornecida"
  echo "💡 Uso: ./migrate-neon.sh 'postgresql://user:pass@host:5432/db'"
  exit 1
fi

CONNECTION_STRING="$1"

echo "🔄 Configurando ambiente..."
node scripts/setup-postgres-online.js "$CONNECTION_STRING"

echo "🔄 Executando migração..."
node scripts/migrate-database.js

if [ $? -eq 0 ]; then
  echo "✅ Migração concluída com sucesso!"
  echo "🌐 Iniciando servidor..."
  npm start
else
  echo "❌ Erro na migração"
  exit 1
fi
