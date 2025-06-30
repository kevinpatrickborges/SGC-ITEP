const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const EmprestimoProntuario = sequelize.define('EmprestimoProntuario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  dataSaida: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  devolucaoPrevista: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  devolucaoEfetiva: {
    type: DataTypes.DATE,
  },
  responsavel: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nome ou matrícula do servidor responsável.'
  },
  setorResponsavel: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  tableName: 'NugecidEmprestimosProntuarios',
  timestamps: true
});

module.exports = EmprestimoProntuario;
