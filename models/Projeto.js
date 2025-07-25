const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Projeto = sequelize.define('Projeto', {
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
    defaultValue: '#007bff',
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  status: {
    type: DataTypes.ENUM('ativo', 'pausado', 'concluido', 'cancelado'),
    allowNull: false,
    defaultValue: 'ativo'
  },
  dataInicio: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dataFim: {
    type: DataTypes.DATE,
    allowNull: true
  },
  prioridade: {
    type: DataTypes.ENUM('baixa', 'media', 'alta', 'critica'),
    allowNull: false,
    defaultValue: 'media'
  },
  progresso: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
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
  responsavel: {
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
  tableName: 'projetos',
  timestamps: true,
  paranoid: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
});

module.exports = Projeto;