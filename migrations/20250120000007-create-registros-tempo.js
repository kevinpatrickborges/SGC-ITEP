'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('registros_tempo', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      horasGastas: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      dataInicio: {
        type: Sequelize.DATE,
        allowNull: false
      },
      dataFim: {
        type: Sequelize.DATE,
        allowNull: true
      },
      tipo: {
        type: Sequelize.ENUM('manual', 'cronometro'),
        allowNull: false,
        defaultValue: 'manual'
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
      usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
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
      faturavel: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      valorHora: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      aprovado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      aprovadoPor: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      dataAprovacao: {
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
      { fields: ['tarefaId', 'dataInicio'], name: 'registros_tempo_tarefa_id_data_inicio' },
      { fields: ['usuarioId', 'dataInicio'], name: 'registros_tempo_usuario_id_data_inicio' },
      { fields: ['projetoId', 'dataInicio'], name: 'registros_tempo_projeto_id_data_inicio' },
      { fields: ['aprovado'], name: 'registros_tempo_aprovado' },
      { fields: ['faturavel'], name: 'registros_tempo_faturavel' },
      { fields: ['tipo'], name: 'registros_tempo_tipo' }
    ];
    
    for (const index of indexes) {
      try {
        await queryInterface.addIndex('registros_tempo', index.fields, { name: index.name });
      } catch (error) {
        console.log(`Índice ${index.name} já existe`);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('registros_tempo');
  }
};