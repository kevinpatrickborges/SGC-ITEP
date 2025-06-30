const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./Usuario');

const Auditoria = sequelize.define('Auditoria', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  acao: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entidade: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entidadeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  detalhes: {
    type: DataTypes.JSON,
    allowNull: true
  },
  dataHora: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Auditoria;
