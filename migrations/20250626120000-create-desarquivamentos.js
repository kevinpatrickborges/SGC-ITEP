'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('desarquivamentos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nome: {
        type: Sequelize.STRING,
        allowNull: false
      },
      numero_prontuario: {
        type: Sequelize.STRING,
        allowNull: false
      },
      motivo: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      solicitante: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('Solicitado', 'Em Andamento', 'Concluído', 'Cancelado'),
        defaultValue: 'Solicitado'
      },
      data_solicitacao: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('desarquivamentos');
  }
};
