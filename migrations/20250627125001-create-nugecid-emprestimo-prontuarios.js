'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('NugecidEmprestimosProntuarios', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      prontuarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'NugecidProntuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      dataSaida: {
        type: Sequelize.DATE,
        allowNull: false
      },
      devolucaoPrevista: {
        type: Sequelize.DATE,
        allowNull: false
      },
      devolucaoEfetiva: {
        type: Sequelize.DATE
      },
      responsavel: {
        type: Sequelize.STRING,
        allowNull: false
      },
      setorResponsavel: {
        type: Sequelize.STRING,
        allowNull: false
      },
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('NugecidEmprestimosProntuarios');
  }
};
