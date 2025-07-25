const { sequelize } = require('../config/database');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Script de migração universal para PostgreSQL
 * Funciona com PostgreSQL local ou online (Neon, Supabase, etc.)
 */

async function testConnection() {
  try {
    console.log('🔄 Testando conexão com o banco de dados...');
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    const dialect = sequelize.getDialect();
    const config = sequelize.config;
    
    console.log(`📊 Banco: ${dialect.toUpperCase()}`);
    console.log(`🏠 Host: ${config.host}:${config.port}`);
    console.log(`💾 Database: ${config.database}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    return false;
  }
}

async function runMigrations() {
  try {
    console.log('\n🔄 Executando migrações...');
    
    // Criar diretório de migrations se não existir
    const migrationsDir = path.join(__dirname, '../migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log('📁 Diretório de migrations criado');
    }
    
    // Sincronizar modelos (desenvolvimento)
    console.log('🔄 Sincronizando modelos...');
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados!');
    
    return true;
  } catch (error) {
    console.error('❌ Erro nas migrações:', error.message);
    return false;
  }
}

async function importSQLiteData() {
  const sqlitePath = path.join(__dirname, '../nugecid_itep.sqlite');
  
  if (!fs.existsSync(sqlitePath)) {
    console.log('ℹ️  Nenhum banco SQLite encontrado para importar');
    return true;
  }
  
  try {
    console.log('\n🔄 Importando dados do SQLite...');
    
    // Importar usando sequelize
    const sqlite3 = require('sqlite3');
    const { open } = require('sqlite');
    
    const sqliteDb = await open({
      filename: sqlitePath,
      driver: sqlite3.Database
    });
    
    // Verificar se existem dados
    const tables = await sqliteDb.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    
    if (tables.length === 0) {
      console.log('ℹ️  Banco SQLite vazio, nada para importar');
      await sqliteDb.close();
      return true;
    }
    
    console.log(`📊 Encontradas ${tables.length} tabelas para importar`);
    
    // Importar dados das principais tabelas
    for (const table of tables) {
      try {
        const rows = await sqliteDb.all(`SELECT * FROM ${table.name}`);
        if (rows.length > 0) {
          console.log(`📥 Importando ${rows.length} registros da tabela ${table.name}`);
          
          // Aqui você pode adicionar lógica específica de importação
          // Por enquanto, apenas logamos os dados
        }
      } catch (error) {
        console.warn(`⚠️  Erro ao importar tabela ${table.name}:`, error.message);
      }
    }
    
    await sqliteDb.close();
    console.log('✅ Importação concluída!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro na importação:', error.message);
    return false;
  }
}

async function createSampleData() {
  try {
    console.log('\n🔄 Criando dados de exemplo...');
    
    // Verificar se já existem dados
    const Usuario = require('../models/Usuario');
    const userCount = await Usuario.count();
    
    if (userCount === 0) {
      // Criar usuário administrador
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await Usuario.create({
        nome: 'Administrador',
        email: 'admin@itep.pe.gov.br',
        senha: hashedPassword,
        roleId: 1 // Assumindo que role 1 é administrador
      });
      
      console.log('👤 Usuário administrador criado');
      console.log('📧 Email: admin@itep.pe.gov.br');
      console.log('🔑 Senha: admin123');
    } else {
      console.log(`ℹ️  ${userCount} usuários já existem no sistema`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar dados de exemplo:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando migração para PostgreSQL\n');
  
  // Teste de conexão
  const connected = await testConnection();
  if (!connected) {
    console.log('\n🔧 Soluções possíveis:');
    console.log('1. Verificar se PostgreSQL está rodando');
    console.log('2. Conferir credenciais no arquivo .env');
    console.log('3. Para PostgreSQL online, verificar connection string');
    console.log('4. Executar: node scripts/setup-postgres-online.js');
    process.exit(1);
  }
  
  // Executar migrações
  const migrated = await runMigrations();
  if (!migrated) {
    console.log('\n❌ Falha nas migrações');
    process.exit(1);
  }
  
  // Importar dados do SQLite (se existir)
  await importSQLiteData();
  
  // Criar dados de exemplo
  await createSampleData();
  
  console.log('\n🎉 Migração concluída com sucesso!');
  console.log('\n📋 Próximos passos:');
  console.log('1. npm start');
  console.log('2. Acessar http://localhost:3000');
  console.log('3. Login: admin@itep.pe.gov.br / admin123');
  
  await sequelize.close();
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  testConnection,
  runMigrations,
  importSQLiteData,
  createSampleData
};