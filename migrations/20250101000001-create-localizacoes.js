'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('localizacoes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      tipo: { type: Sequelize.STRING, allowNull: true },
      sala: { type: Sequelize.STRING, allowNull: true },
      armario: { type: Sequelize.STRING, allowNull: true },
      prateleira: { type: Sequelize.STRING, allowNull: true },
      caixa: { type: Sequelize.STRING, allowNull: true },
      freezer: { type: Sequelize.STRING, allowNull: true },
      observacoes: { type: Sequelize.TEXT, allowNull: true },
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
    await queryInterface.dropTable('localizacoes');
  }
};
