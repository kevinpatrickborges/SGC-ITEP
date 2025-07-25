const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Quadro = sequelize.define('Quadro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cor: {
    type: DataTypes.STRING(7),
    allowNull: true,
    defaultValue: '#6c757d',
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  ordem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  projetoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projetos',
      key: 'id'
    }
  },
  tipo: {
    type: DataTypes.ENUM('kanban', 'lista', 'calendario'),
    allowNull: false,
    defaultValue: 'kanban'
  },
  configuracoes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  criadoPor: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  tableName: 'quadros',
  timestamps: true,
  paranoid: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  indexes: [
    {
      fields: ['projetoId', 'ordem']
    },
    {
      fields: ['projetoId', 'ativo']
    }
  ]
});

module.exports = Quadro;