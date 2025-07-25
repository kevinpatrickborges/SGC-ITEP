
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
