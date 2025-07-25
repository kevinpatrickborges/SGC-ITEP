const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Lista = sequelize.define('Lista', {
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
    defaultValue: '#e9ecef',
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  ordem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  quadroId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'quadros',
      key: 'id'
    }
  },
  tipo: {
    type: DataTypes.ENUM('todo', 'doing', 'done', 'custom'),
    allowNull: false,
    defaultValue: 'custom'
  },
  limiteTarefas: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  configuracoes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      autoMover: false,
      notificarLimite: true,
      ocultarCompletas: false
    }
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
  tableName: 'listas',
  timestamps: true,
  paranoid: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  indexes: [
    {
      fields: ['quadroId', 'ordem']
    },
    {
      fields: ['quadroId', 'ativo']
    }
  ]
});

module.exports = Lista;