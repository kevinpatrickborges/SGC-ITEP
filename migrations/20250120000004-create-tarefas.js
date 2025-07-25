'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tarefas', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      titulo: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pendente', 'em_andamento', 'concluida', 'cancelada'),
        allowNull: false,
        defaultValue: 'pendente'
      },
      prioridade: {
        type: Sequelize.ENUM('baixa', 'media', 'alta', 'critica'),
        allowNull: false,
        defaultValue: 'media'
      },
      etiquetas: {
        type: Sequelize.JSON,
        allowNull: true
      },
      cor: {
        type: Sequelize.STRING(7),
        allowNull: true
      },
      ordem: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      progresso: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      estimativaHoras: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      horasGastas: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0
      },
      dataInicio: {
        type: Sequelize.DATE,
        allowNull: true
      },
      dataVencimento: {
        type: Sequelize.DATE,
        allowNull: true
      },
      dataConclusao: {
        type: Sequelize.DATE,
        allowNull: true
      },
      listaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'listas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      tarefaPaiId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'tarefas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      anexos: {
        type: Sequelize.JSON,
        allowNull: true
      },
      checklist: {
        type: Sequelize.JSON,
        allowNull: true
      },
      dependencias: {
        type: Sequelize.JSON,
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
      { fields: ['listaId', 'ordem'], name: 'tarefas_lista_id_ordem' },
      { fields: ['projetoId', 'status'], name: 'tarefas_projeto_id_status' },
      { fields: ['responsavel'], name: 'tarefas_responsavel' },
      { fields: ['dataVencimento'], name: 'tarefas_data_vencimento' },
      { fields: ['prioridade'], name: 'tarefas_prioridade' },
      { fields: ['tarefaPaiId'], name: 'tarefas_tarefa_pai_id' },
      { fields: ['criadoPor'], name: 'tarefas_criado_por' },
      { fields: ['status'], name: 'tarefas_status' }
    ];
    
    for (const index of indexes) {
      try {
        await queryInterface.addIndex('tarefas', index.fields, { name: index.name });
      } catch (error) {
        console.log(`Índice ${index.name} já existe`);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tarefas');
  }
};