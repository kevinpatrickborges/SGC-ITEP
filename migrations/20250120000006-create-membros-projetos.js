'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('membros_projetos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
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
      papel: {
        type: Sequelize.ENUM('admin', 'gerente', 'membro', 'observador'),
        allowNull: false,
        defaultValue: 'membro'
      },
      permissoes: {
        type: Sequelize.JSON,
        allowNull: true
      },
      dataConvite: {
        type: Sequelize.DATE,
        allowNull: true
      },
      dataAceite: {
        type: Sequelize.DATE,
        allowNull: true
      },
      statusConvite: {
        type: Sequelize.ENUM('pendente', 'aceito', 'recusado'),
        allowNull: false,
        defaultValue: 'aceito'
      },
      convidadoPor: {
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

    // Índices (verificar se já existem)
    const indexes = [
      { fields: ['projetoId', 'usuarioId'], options: { unique: true, name: 'unique_projeto_usuario' } },
      { fields: ['usuarioId'], name: 'membros_projetos_usuario_id' },
      { fields: ['papel'], name: 'membros_projetos_papel' },
      { fields: ['statusConvite'], name: 'membros_projetos_status_convite' },
      { fields: ['ativo'], name: 'membros_projetos_ativo' }
    ];
    
    for (const index of indexes) {
      try {
        if (index.options) {
          await queryInterface.addIndex('membros_projetos', index.options);
        } else {
          await queryInterface.addIndex('membros_projetos', index.fields, { name: index.name });
        }
      } catch (error) {
        console.log(`Índice ${index.name || index.options.name} já existe`);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('membros_projetos');
  }
};