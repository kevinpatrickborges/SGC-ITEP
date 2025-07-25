'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('listas', {
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
        defaultValue: '#e9ecef'
      },
      ordem: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      quadroId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'quadros',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tipo: {
        type: Sequelize.ENUM('todo', 'doing', 'done', 'custom'),
        allowNull: false,
        defaultValue: 'custom'
      },
      limiteTarefas: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      configuracoes: {
        type: Sequelize.JSON,
        allowNull: true
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

    // Índices (verificar se já existem)
    try {
      await queryInterface.addIndex('listas', ['quadroId', 'ordem'], {
        name: 'listas_quadro_id_ordem_new'
      });
    } catch (error) {
      console.log('Índice listas_quadro_id_ordem já existe');
    }
    
    try {
      await queryInterface.addIndex('listas', ['quadroId', 'ativo'], {
        name: 'listas_quadro_id_ativo_new'
      });
    } catch (error) {
      console.log('Índice listas_quadro_id_ativo já existe');
    }
    
    try {
      await queryInterface.addIndex('listas', ['criadoPor']);
    } catch (error) {
      console.log('Índice listas_criado_por já existe');
    }
    
    try {
      await queryInterface.addIndex('listas', ['tipo']);
    } catch (error) {
      console.log('Índice listas_tipo já existe');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('listas');
  }
};