const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ComentarioTarefa = sequelize.define('ComentarioTarefa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  conteudo: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  tipo: {
    type: DataTypes.ENUM('comentario', 'atividade', 'sistema'),
    allowNull: false,
    defaultValue: 'comentario'
  },
  tarefaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tarefas',
      key: 'id'
    }
  },
  autorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  mencoes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  anexos: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  editado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  dataEdicao: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'comentarios_tarefas',
  timestamps: true,
  paranoid: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  indexes: [
    {
      fields: ['tarefaId', 'createdAt']
    },
    {
      fields: ['autorId']
    },
    {
      fields: ['tipo']
    }
  ]
});

module.exports = ComentarioTarefa;