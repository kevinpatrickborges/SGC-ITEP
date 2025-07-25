'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('quadros', {
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
        defaultValue: '#6c757d'
      },
      ordem: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      projetoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'projetos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tipo: {
        type: Sequelize.ENUM('kanban', 'lista', 'calendario'),
        allowNull: false,
        defaultValue: 'kanban'
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
      await queryInterface.addIndex('quadros', ['projetoId', 'ordem'], {
        name: 'quadros_projeto_id_ordem_new'
      });
    } catch (error) {
      console.log('Índice quadros_projeto_id_ordem já existe');
    }
    
    try {
      await queryInterface.addIndex('quadros', ['projetoId', 'ativo'], {
        name: 'quadros_projeto_id_ativo_new'
      });
    } catch (error) {
      console.log('Índice quadros_projeto_id_ativo já existe');
    }
    
    try {
      await queryInterface.addIndex('quadros', ['criadoPor']);
    } catch (error) {
      console.log('Índice quadros_criado_por já existe');
    }
    
    try {
      await queryInterface.addIndex('quadros', ['tipo']);
    } catch (error) {
      console.log('Índice quadros_tipo já existe');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('quadros');
  }
};