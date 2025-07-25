'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('projetos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      nome: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      cor: {
        type: Sequelize.STRING(7),
        allowNull: true,
        defaultValue: '#007bff'
      },
      status: {
        type: Sequelize.ENUM('ativo', 'pausado', 'concluido', 'cancelado'),
        allowNull: false,
        defaultValue: 'ativo'
      },
      dataInicio: {
        type: Sequelize.DATE,
        allowNull: true
      },
      dataFim: {
        type: Sequelize.DATE,
        allowNull: true
      },
      prioridade: {
        type: Sequelize.ENUM('baixa', 'media', 'alta', 'critica'),
        allowNull: false,
        defaultValue: 'media'
      },
      progresso: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      criadoPor: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      responsavel: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Índices
    await queryInterface.addIndex('projetos', ['criadoPor']);
    await queryInterface.addIndex('projetos', ['responsavel']);
    await queryInterface.addIndex('projetos', ['status']);
    await queryInterface.addIndex('projetos', ['prioridade']);
    await queryInterface.addIndex('projetos', ['ativo']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('projetos');
  }
};