const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modelo Movimentação
 * - tipo (entrada, saída temporária, definitiva)
 * - data/hora
 * - agente
 * - destino
 * - justificativa
 * - arquivo anexo
 * - assinatura digital
 */
const Movimentacao = sequelize.define('Movimentacao', {
  tipoMovimentacao: { type: DataTypes.ENUM('entrada', 'saida_temporaria', 'saida_definitiva'), allowNull: false },
  data: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  agenteNome: { type: DataTypes.STRING, allowNull: false },
  agenteMatricula: { type: DataTypes.STRING, allowNull: false },
  destino: { type: DataTypes.STRING, allowNull: true },
  justificativa: { type: DataTypes.TEXT, allowNull: true },
  anexo: { type: DataTypes.STRING, allowNull: true }, // caminho do arquivo
  assinatura: { type: DataTypes.STRING, allowNull: true } // hash ou arquivo
}, {
  tableName: 'movimentacoes',
  timestamps: true,
  paranoid: true
});

module.exports = Movimentacao;
