'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // SQLite: remover índice único antigo criado automaticamente
    // O nome padrão costuma ser 'sqlite_autoindex_Desarquivamentos_1'
    await queryInterface.sequelize.query(
      "DROP INDEX IF EXISTS sqlite_autoindex_Desarquivamentos_1;"
    );

    // Criar índice único apenas para registros ativos (deletedAt IS NULL)
    await queryInterface.sequelize.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_Desarquivamentos_numDocumento_active ON Desarquivamentos(numDocumento) WHERE deletedAt IS NULL;"
    );
  },

  async down(queryInterface, Sequelize) {
    // Remover o índice parcial criado
    await queryInterface.sequelize.query(
      "DROP INDEX IF EXISTS idx_Desarquivamentos_numDocumento_active;"
    );

    // Recriar índice único simples (todos os registros)
    await queryInterface.sequelize.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS sqlite_autoindex_Desarquivamentos_1 ON Desarquivamentos(numDocumento);"
    );
  }
}; 