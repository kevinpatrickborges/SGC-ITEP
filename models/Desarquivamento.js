const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Desarquivamento = sequelize.define('Desarquivamento', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  // Campo 1: SOLICITAÇÃO (Físico/Digital/Não Localizado)
  solicitacao: {
    type: DataTypes.ENUM('Físico', 'Digital', 'Não Localizado'),
    allowNull: true,
  },
  // Campo 2: STATUS
  status: {
    type: DataTypes.ENUM(
      'Finalizado',
      'Desarquivado',
      'Não coletado',
      'Solicitado',
      'Rearquivamento solicitado',
      'Retirado pelo setor',
      'Não localizado'
    ),
    defaultValue: 'Solicitado'
  },
  // Campo 3: NOME COMPLETO
  nomeCompleto: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Adicionando de volta o numDocumento e mantendo numNic
  numDocumento: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  // Campo 4: Nº DO NIC/LAUDO/AUTO/INFORMAÇÃO TÉCNICA
  numNic: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Campo 5: Nº PROCESSO
  numProcesso: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Campo 6: TIPO DE DOCUMENTO
  tipoDocumento: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Campo 7: DATA DE SOLICITAÇÃO
  dataSolicitacao: {
    type: DataTypes.DATE,
    allowNull: false
  },
  // Campo 8: DATA DESARQUIVAMENTO
  dataDesarquivamento: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Campo 9: DATA DEVOLUÇÃO PELO SETOR
  dataDevolucao: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Campo 10: SETOR DEMANDANTE
  setorDemandante: {
    type: DataTypes.STRING,
    allowNull: true // Alterado para permitir valores nulos, conforme a planilha
  },
  // Campo 11: SERVIDOR DO ITEP RESPONSÁVEL (MATRÍCULA)
  servidorResponsavel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Campo 12: FINALIDADE DO DESARQUIVAMENTO
  finalidade: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Campo 13: SOLICITAÇÃO DE PRAZO DE DESARQUIVAMENTO
  solicitacaoProrrogacao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Campo 14: DATA PRAZO DEVOLUÇÃO
  dataPrazoDevolucao: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Usuarios', // Corrected from Users
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Usuarios', // Corrected from Users
      key: 'id'
    }
  },
  deletedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Usuarios',
      key: 'id'
    }
  }
}, {
  tableName: 'Desarquivamentos',
  timestamps: true,
  paranoid: true, // Habilita soft-delete (campo deletedAt)
  hooks: {
    beforeDestroy: async (desarquivamento, options) => {
      if (options.userId) {
        await desarquivamento.update({ deletedBy: options.userId }, { transaction: options.transaction });
      }
    }
  }
});

module.exports = Desarquivamento;
