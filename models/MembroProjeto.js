const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MembroProjeto = sequelize.define('MembroProjeto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  projetoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projetos',
      key: 'id'
    }
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  papel: {
    type: DataTypes.ENUM('admin', 'gerente', 'membro', 'observador'),
    allowNull: false,
    defaultValue: 'membro'
  },
  permissoes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      criarTarefas: true,
      editarTarefas: true,
      excluirTarefas: false,
      gerenciarMembros: false,
      editarProjeto: false
    }
  },
  dataConvite: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dataAceite: {
    type: DataTypes.DATE,
    allowNull: true
  },
  statusConvite: {
    type: DataTypes.ENUM('pendente', 'aceito', 'recusado'),
    allowNull: false,
    defaultValue: 'aceito'
  },
  convidadoPor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'membros_projetos',
  timestamps: true,
  paranoid: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  indexes: [
    {
      unique: true,
      fields: ['projetoId', 'usuarioId']
    },
    {
      fields: ['usuarioId']
    },
    {
      fields: ['papel']
    },
    {
      fields: ['statusConvite']
    }
  ]
});

module.exports = MembroProjeto;