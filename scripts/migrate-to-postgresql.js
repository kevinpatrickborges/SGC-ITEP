const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Script para migrar do SQLite para PostgreSQL
 * 
 * Pré-requisitos:
 * 1. PostgreSQL instalado e rodando
 * 2. Banco de dados 'sgc_itep_nugecid' criado
 * 3. Usuário 'postgres' com permissões adequadas
 */

async function migrateToPostgreSQL() {
  console.log('🔄 Iniciando migração para PostgreSQL...');
  
  try {
    // 1. Backup do banco SQLite atual
    console.log('📦 Criando backup do banco SQLite...');
    const backupPath = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupPath, `nugecid_backup_${timestamp}.sqlite`);
    
    if (fs.existsSync(path.join(__dirname, '../nugecid_itep.sqlite'))) {
      fs.copyFileSync(
        path.join(__dirname, '../nugecid_itep.sqlite'),
        backupFile
      );
      console.log(`✅ Backup criado: ${backupFile}`);
    }
    
    // 2. Atualizar .env para PostgreSQL
    console.log('⚙️ Atualizando configuração do banco...');
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent = envContent.replace(
      /DB_DIALECT=sqlite/,
      'DB_DIALECT=postgres'
    );
    
    envContent = envContent.replace(
      /# (DB_NAME=sgc_itep_nugecid)/,
      '$1'
    );
    
    envContent = envContent.replace(
      /# (DB_USER=postgres)/,
      '$1'
    );
    
    envContent = envContent.replace(
      /# (DB_PASS=postgres)/,
      '$1'
    );
    
    envContent = envContent.replace(
      /# (DB_HOST=localhost)/,
      '$1'
    );
    
    envContent = envContent.replace(
      /# (DB_PORT=5432)/,
      '$1'
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Configuração atualizada');
    
    // 3. Executar migrações
    console.log('🔄 Executando migrações no PostgreSQL...');
    execSync('npx sequelize-cli db:migrate', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    console.log('✅ Migração para PostgreSQL concluída com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Reinicie o servidor: npm start');
    console.log('2. Verifique se todas as funcionalidades estão operando');
    console.log('3. Importe dados do backup se necessário');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    console.log('\n🔧 Soluções possíveis:');
    console.log('1. Verifique se o PostgreSQL está rodando');
    console.log('2. Confirme se o banco "sgc_itep_nugecid" existe');
    console.log('3. Verifique as credenciais no arquivo .env');
    process.exit(1);
  }
}

// Verificar se PostgreSQL está disponível
function checkPostgreSQL() {
  try {
    execSync('psql --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

if (require.main === module) {
  if (!checkPostgreSQL()) {
    console.log('❌ PostgreSQL não encontrado!');
    console.log('\n📥 Para instalar o PostgreSQL:');
    console.log('1. Baixe em: https://www.postgresql.org/download/windows/');
    console.log('2. Execute o instalador');
    console.log('3. Configure usuário "postgres" com senha "postgres"');
    console.log('4. Crie o banco: CREATE DATABASE sgc_itep_nugecid;');
    console.log('5. Execute este script novamente');
    process.exit(1);
  }
  
  migrateToPostgreSQL();
}

module.exports = { migrateToPostgreSQL, checkPostgreSQL };