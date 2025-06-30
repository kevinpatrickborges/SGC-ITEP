const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modelo Localização Física
 * - sala, armário, prateleira, caixa, freezer, tipo, observações
 */
const Localizacao = sequelize.define('Localizacao', {
  tipo: { type: DataTypes.STRING, allowNull: true }, // sala, freezer, etc.
  sala: { type: DataTypes.STRING, allowNull: true },
  armario: { type: DataTypes.STRING, allowNull: true },
  prateleira: { type: DataTypes.STRING, allowNull: true },
  caixa: { type: DataTypes.STRING, allowNull: true },
  freezer: { type: DataTypes.STRING, allowNull: true },
  observacoes: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'localizacoes',
  timestamps: true,
  paranoid: true
});

module.exports = Localizacao;
