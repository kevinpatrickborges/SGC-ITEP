'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Desarquivamentos', 'deletedBy', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Usuarios', // Nome da tabela de usuários
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Desarquivamentos', 'deletedBy');
  },
};
