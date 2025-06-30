'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('NugecidProntuarios', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      numProntuario: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      nomePrincipal: {
        type: Sequelize.STRING,
        allowNull: false
      },
      localizacaoFisica: {
        type: Sequelize.STRING
      },
      digitalizadoEm: {
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.ENUM('Disponível', 'Emprestado', 'Em Digitalização', 'Pendente', 'Descartado'),
        defaultValue: 'Disponível',
        allowNull: false
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
    await queryInterface.dropTable('NugecidProntuarios');
  }
};
