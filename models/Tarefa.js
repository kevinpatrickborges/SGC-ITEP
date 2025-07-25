const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tarefa = sequelize.define('Tarefa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titulo: {
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
  status: {
    type: DataTypes.ENUM('pendente', 'em_andamento', 'concluida', 'cancelada'),
    allowNull: false,
    defaultValue: 'pendente'
  },
  prioridade: {
    type: DataTypes.ENUM('baixa', 'media', 'alta', 'critica'),
    allowNull: false,
    defaultValue: 'media'
  },
  etiquetas: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  cor: {
    type: DataTypes.STRING(7),
    allowNull: true,
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  ordem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
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
  estimativaHoras: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  horasGastas: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  dataInicio: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dataVencimento: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dataConclusao: {
    type: DataTypes.DATE,
    allowNull: true
  },
  listaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'listas',
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
  tarefaPaiId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tarefas',
      key: 'id'
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
  anexos: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  checklist: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  dependencias: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'tarefas',
  timestamps: true,
  paranoid: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  indexes: [
    {
      fields: ['listaId', 'ordem']
    },
    {
      fields: ['projetoId', 'status']
    },
    {
      fields: ['responsavel']
    },
    {
      fields: ['dataVencimento']
    },
    {
      fields: ['prioridade']
    },
    {
      fields: ['tarefaPaiId']
    }
  ]
});

module.exports = Tarefa;