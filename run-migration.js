// Script para executar a migração manualmente
const { sequelize } = require('./config/database');
const migration = require('./migrations/add-localizacao-vestigio');

async function runMigration() {
  try {
    console.log('Iniciando migração...');
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao executar migração:', error);
    process.exit(1);
  }
}

runMigration();
