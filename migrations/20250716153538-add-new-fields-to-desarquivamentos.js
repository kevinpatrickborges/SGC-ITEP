'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Adicionar novas colunas
      await queryInterface.addColumn('Desarquivamentos', 'solicitacao', {
        type: Sequelize.ENUM('Físico', 'Digital', 'Não Localizado'),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('Desarquivamentos', 'numNic', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('Desarquivamentos', 'solicitacaoProrrogacao', {
        type: Sequelize.TEXT,
        allowNull: true,
      }, { transaction });

      // Remover colunas antigas
      await queryInterface.removeColumn('Desarquivamentos', 'tipoDesarquivamento', { transaction });
      await queryInterface.removeColumn('Desarquivamentos', 'prazoSolicitado', { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Reverter a adição de colunas
      await queryInterface.removeColumn('Desarquivamentos', 'solicitacao', { transaction });
      await queryInterface.removeColumn('Desarquivamentos', 'numNic', { transaction });
      await queryInterface.removeColumn('Desarquivamentos', 'solicitacaoProrrogacao', { transaction });

      // Readicionar colunas antigas
      await queryInterface.addColumn('Desarquivamentos', 'tipoDesarquivamento', {
        type: Sequelize.ENUM('Físico', 'Digital', 'Não Localizado'),
        allowNull: false,
      }, { transaction });

      await queryInterface.addColumn('Desarquivamentos', 'prazoSolicitado', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });
    });
  }
};
