'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('movimentacoes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      vestigioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'vestigios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      localizacaoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'localizacoes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      data: { type: Sequelize.DATE, allowNull: false },
      agente: { type: Sequelize.STRING(100), allowNull: true },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('movimentacoes');
  }
};
