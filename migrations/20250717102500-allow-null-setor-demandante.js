'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Desarquivamentos', 'setorDemandante', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Reverte a alteração, caso seja necessário
    await queryInterface.changeColumn('Desarquivamentos', 'setorDemandante', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  }
};
