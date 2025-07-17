'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDefinition = await queryInterface.describeTable('Desarquivamentos');
    
    await queryInterface.sequelize.transaction(async (transaction) => {
      if (!tableDefinition.solicitacao) {
        await queryInterface.addColumn('Desarquivamentos', 'solicitacao', {
          type: Sequelize.ENUM('Físico', 'Digital', 'Não Localizado'),
          allowNull: true,
        }, { transaction });
      }

      if (!tableDefinition.numNic) {
        await queryInterface.addColumn('Desarquivamentos', 'numNic', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
      }

      if (!tableDefinition.solicitacaoProrrogacao) {
        await queryInterface.addColumn('Desarquivamentos', 'solicitacaoProrrogacao', {
          type: Sequelize.TEXT,
          allowNull: true,
        }, { transaction });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Desarquivamentos', 'solicitacao', { transaction });
      await queryInterface.removeColumn('Desarquivamentos', 'numNic', { transaction });
      await queryInterface.removeColumn('Desarquivamentos', 'solicitacaoProrrogacao', { transaction });
    });
  }
};
