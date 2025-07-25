@echo off
REM Script de migração automática para Neon.tech (Windows)

echo 🚀 Iniciando migração para Neon.tech PostgreSQL

if "%1"=="" (
  echo ❌ Erro: Connection string não fornecida
  echo 💡 Uso: migrate-neon.bat "postgresql://user:pass@host:5432/db"
  exit /b 1
)

set CONNECTION_STRING=%1

echo 🔄 Configurando ambiente...
node scripts/setup-postgres-online.js %CONNECTION_STRING%

echo 🔄 Executando migração...
node scripts/migrate-database.js

if %errorlevel% equ 0 (
  echo ✅ Migração concluída com sucesso!
  echo 🌐 Iniciando servidor...
  npm start
) else (
  echo ❌ Erro na migração
  exit /b 1
)
