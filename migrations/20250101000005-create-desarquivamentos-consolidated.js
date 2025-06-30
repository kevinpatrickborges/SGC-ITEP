'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Desarquivamentos', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tipoDesarquivamento: {
        type: Sequelize.ENUM('Físico', 'Digital'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('Solicitado', 'Em posse', 'Devolvido', 'Extraviado'),
        defaultValue: 'Solicitado',
      },
      nomeCompleto: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      numDocumento: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      numProcesso: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tipoDocumento: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dataSolicitacao: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      dataDesarquivamento: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      dataDevolucao: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      setorDemandante: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      servidorResponsavel: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      finalidade: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      prazoSolicitado: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.INTEGER,
        references: {
          model: 'usuarios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        references: {
          model: 'usuarios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Desarquivamentos');
  },
};
