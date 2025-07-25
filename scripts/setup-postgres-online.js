const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Script para configurar PostgreSQL usando serviços online gratuitos
 * 
 * Opções disponíveis:
 * 1. Neon.tech (PostgreSQL serverless gratuito)
 * 2. Supabase (PostgreSQL com dashboard)
 * 3. ElephantSQL (PostgreSQL como serviço)
 */

const POSTGRES_ONLINE_OPTIONS = {
  neon: {
    name: 'Neon.tech',
    url: 'https://neon.tech',
    description: 'PostgreSQL serverless gratuito com 10GB',
    setup: 'Criar conta → Novo projeto → Copiar connection string'
  },
  supabase: {
    name: 'Supabase',
    url: 'https://supabase.com',
    description: 'PostgreSQL com dashboard e APIs automáticas',
    setup: 'Criar conta → Novo projeto → Database → Connection pooling'
  },
  elephantsql: {
    name: 'ElephantSQL',
    url: 'https://www.elephantsql.com',
    description: 'PostgreSQL como serviço com plano gratuito',
    setup: 'Criar conta → Create New Instance → Tiny Turtle (Free)'
  }
};

function showOnlineOptions() {
  console.log('🐘 Opções de PostgreSQL Online Gratuito:\n');
  
  Object.entries(POSTGRES_ONLINE_OPTIONS).forEach(([key, option]) => {
    console.log(`📌 ${option.name}`);
    console.log(`   URL: ${option.url}`);
    console.log(`   Descrição: ${option.description}`);
    console.log(`   Setup: ${option.setup}\n`);
  });
}

function updateEnvForOnlinePostgres(connectionString) {
  try {
    // Parse connection string: postgresql://user:pass@host:port/dbname
    const url = new URL(connectionString);
    
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Atualizar configurações
    envContent = envContent.replace(/DB_DIALECT=.*/g, 'DB_DIALECT=postgres');
    envContent = envContent.replace(/DB_NAME=.*/g, `DB_NAME=${url.pathname.slice(1)}`);
    envContent = envContent.replace(/DB_USER=.*/g, `DB_USER=${url.username}`);
    envContent = envContent.replace(/DB_PASS=.*/g, `DB_PASS=${url.password}`);
    envContent = envContent.replace(/DB_HOST=.*/g, `DB_HOST=${url.hostname}`);
    envContent = envContent.replace(/DB_PORT=.*/g, `DB_PORT=${url.port || 5432}`);
    
    // Adicionar SSL se necessário
    if (!envContent.includes('DB_SSL')) {
      envContent += '\nDB_SSL=true\n';
    } else {
      envContent = envContent.replace(/DB_SSL=.*/g, 'DB_SSL=true');
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Configuração .env atualizada com PostgreSQL online!');
    
  } catch (error) {
    console.error('❌ Erro ao processar connection string:', error.message);
    console.log('\n📝 Formato esperado: postgresql://user:pass@host:port/dbname');
  }
}

function createMigrationScript() {
  const migrationScript = `
const { sequelize } = require('../config/database');
const { execSync } = require('child_process');

async function runMigration() {
  try {
    console.log('🔄 Testando conexão com PostgreSQL online...');
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    console.log('🔄 Executando migrações...');
    execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
    
    console.log('✅ Migração concluída com sucesso!');
    console.log('\n🚀 Sistema pronto para usar PostgreSQL online!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    console.log('\n🔧 Verifique:');
    console.log('1. Connection string está correta');
    console.log('2. Banco de dados está acessível');
    console.log('3. Credenciais estão válidas');
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
`;
  
  fs.writeFileSync(
    path.join(__dirname, 'run-online-migration.js'),
    migrationScript
  );
  
  console.log('✅ Script de migração online criado!');
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🐘 Setup PostgreSQL Online para SGC-ITEP\n');
    showOnlineOptions();
    console.log('💡 Uso:');
    console.log('node setup-postgres-online.js <connection_string>');
    console.log('\nExemplo:');
    console.log('node setup-postgres-online.js "postgresql://user:pass@host:5432/dbname"');
    return;
  }
  
  const connectionString = args[0];
  
  console.log('🔄 Configurando PostgreSQL online...');
  updateEnvForOnlinePostgres(connectionString);
  createMigrationScript();
  
  console.log('\n📋 Próximos passos:');
  console.log('1. node scripts/run-online-migration.js');
  console.log('2. npm start');
  console.log('3. Verificar funcionamento do sistema');
}

if (require.main === module) {
  main();
}

module.exports = {
  showOnlineOptions,
  updateEnvForOnlinePostgres,
  createMigrationScript
};