'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('comentarios_tarefas', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      conteudo: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      tipo: {
        type: Sequelize.ENUM('comentario', 'atividade', 'sistema'),
        allowNull: false,
        defaultValue: 'comentario'
      },
      tarefaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tarefas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      autorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      mencoes: {
        type: Sequelize.JSON,
        allowNull: true
      },
      anexos: {
        type: Sequelize.JSON,
        allowNull: true
      },
      editado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      dataEdicao: {
        type: Sequelize.DATE,
        allowNull: true
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
    const indexes = [
      { fields: ['tarefaId', 'createdAt'], name: 'comentarios_tarefas_tarefa_id_created_at' },
      { fields: ['autorId'], name: 'comentarios_tarefas_autor_id' },
      { fields: ['tipo'], name: 'comentarios_tarefas_tipo' },
      { fields: ['ativo'], name: 'comentarios_tarefas_ativo' }
    ];
    
    for (const index of indexes) {
      try {
        await queryInterface.addIndex('comentarios_tarefas', index.fields, { name: index.name });
      } catch (error) {
        console.log(`Índice ${index.name} já existe`);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('comentarios_tarefas');
  }
};