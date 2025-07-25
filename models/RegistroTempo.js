const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RegistroTempo = sequelize.define('RegistroTempo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  horasGastas: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  dataInicio: {
    type: DataTypes.DATE,
    allowNull: false
  },
  dataFim: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tipo: {
    type: DataTypes.ENUM('manual', 'automatico', 'cronometro'),
    allowNull: false,
    defaultValue: 'manual'
  },
  tarefaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tarefas',
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
  projetoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projetos',
      key: 'id'
    }
  },
  faturavel: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  valorHora: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  aprovado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  aprovadoPor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  dataAprovacao: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'registros_tempo',
  timestamps: true,
  paranoid: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  indexes: [
    {
      fields: ['tarefaId', 'usuarioId']
    },
    {
      fields: ['projetoId', 'dataInicio']
    },
    {
      fields: ['usuarioId', 'dataInicio']
    },
    {
      fields: ['aprovado']
    },
    {
      fields: ['faturavel']
    }
  ]
});

module.exports = RegistroTempo;