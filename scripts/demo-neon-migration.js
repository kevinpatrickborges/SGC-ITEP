const fs = require('fs');
const path = require('path');

/**
 * Demonstração de migração para Neon.tech PostgreSQL
 * Este script simula a configuração para um banco PostgreSQL online
 */

// Exemplo de connection string do Neon.tech
const NEON_EXAMPLE = {
  connectionString: 'postgresql://neondb_owner:AbCdEf123456@ep-cool-meadow-a5b6c7d8.us-east-1.aws.neon.tech/neondb?sslmode=require',
  host: 'ep-cool-meadow-a5b6c7d8.us-east-1.aws.neon.tech',
  database: 'neondb',
  username: 'neondb_owner',
  password: 'AbCdEf123456',
  port: 5432,
  ssl: true
};

function createDemoEnv() {
  const envPath = path.join(__dirname, '../.env.neon-demo');
  
  const envContent = `# Configuração PostgreSQL Neon.tech (DEMO)
DB_DIALECT=postgres
DB_NAME=${NEON_EXAMPLE.database}
DB_USER=${NEON_EXAMPLE.username}
DB_PASS=${NEON_EXAMPLE.password}
DB_HOST=${NEON_EXAMPLE.host}
DB_PORT=${NEON_EXAMPLE.port}
DB_SSL=true

# Sessão
SESSION_SECRET=itep2025

# Internacionalização
DEFAULT_LANG=pt-BR

# Outras configs
PORT=3000
ADMIN_USER=admin
ADMIN_PASS=securepassword

# SQLite (backup)
# DB_DIALECT=sqlite
# DB_STORAGE=./nugecid_itep.sqlite
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Arquivo .env.neon-demo criado!');
  console.log('📁 Localização:', envPath);
}

function showNeonInstructions() {
  console.log('🐘 Migração para Neon.tech PostgreSQL\n');
  
  console.log('📋 Passos para configurar Neon.tech:');
  console.log('1. Acesse https://neon.tech');
  console.log('2. Crie uma conta gratuita');
  console.log('3. Clique em "Create Project"');
  console.log('4. Escolha um nome para o projeto (ex: sgc-itep)');
  console.log('5. Selecione a região mais próxima');
  console.log('6. Clique em "Create Project"');
  console.log('7. Na dashboard, clique em "Connection Details"');
  console.log('8. Copie a "Connection String"\n');
  
  console.log('🔗 Exemplo de Connection String:');
  console.log(NEON_EXAMPLE.connectionString);
  console.log('');
  
  console.log('⚡ Comando para aplicar:');
  console.log('node scripts/setup-postgres-online.js "SUA_CONNECTION_STRING_AQUI"');
  console.log('');
  
  console.log('🎯 Vantagens do Neon.tech:');
  console.log('• ✅ 10GB de armazenamento gratuito');
  console.log('• ✅ Backup automático');
  console.log('• ✅ SSL/TLS habilitado');
  console.log('• ✅ Dashboard web para monitoramento');
  console.log('• ✅ Branching de banco de dados');
  console.log('• ✅ Serverless (paga apenas pelo uso)');
  console.log('');
}

function createMigrationScript() {
  const scriptContent = `#!/bin/bash
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
`;
  
  const scriptPath = path.join(__dirname, 'migrate-neon.sh');
  fs.writeFileSync(scriptPath, scriptContent);
  
  // Criar versão Windows
  const batContent = `@echo off
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
`;
  
  const batPath = path.join(__dirname, 'migrate-neon.bat');
  fs.writeFileSync(batPath, batContent);
  
  console.log('✅ Scripts de migração criados:');
  console.log('🐧 Linux/Mac:', scriptPath);
  console.log('🪟 Windows:', batPath);
}

function showQuickStart() {
  console.log('⚡ Quick Start - Migração em 3 passos:\n');
  
  console.log('1️⃣ Criar conta Neon.tech:');
  console.log('   https://neon.tech → Sign Up → Create Project\n');
  
  console.log('2️⃣ Copiar Connection String:');
  console.log('   Dashboard → Connection Details → Copy\n');
  
  console.log('3️⃣ Executar migração:');
  console.log('   migrate-neon.bat "postgresql://user:pass@host:5432/db"\n');
  
  console.log('🎉 Pronto! Sistema rodando com PostgreSQL na nuvem!');
}

function main() {
  console.clear();
  showNeonInstructions();
  createDemoEnv();
  createMigrationScript();
  showQuickStart();
  
  console.log('\n📚 Documentação completa:');
  console.log('📄 README-MIGRACAO-COMPLETA.md');
  console.log('🔧 scripts/setup-postgres-online.js');
  console.log('🚀 scripts/migrate-database.js');
}

if (require.main === module) {
  main();
}

module.exports = {
  createDemoEnv,
  showNeonInstructions,
  createMigrationScript,
  NEON_EXAMPLE
};