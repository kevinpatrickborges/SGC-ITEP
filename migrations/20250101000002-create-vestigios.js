'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('vestigios', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      tipo: { type: Sequelize.STRING(100), allowNull: false },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      origem: { type: Sequelize.STRING(100), allowNull: false },
      data_entrada: { type: Sequelize.DATE, allowNull: true },
      responsavel: { type: Sequelize.STRING(100), allowNull: true },
      localizacaoId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'localizacoes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('vestigios');
  }
};
