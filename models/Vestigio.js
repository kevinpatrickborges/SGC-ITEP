const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Modelo Vestígio
 * - código único (UUID/QR)
 * - tipo
 * - número do laudo
 * - número do processo
 * - descrição
 * - origem
 * - data/hora de entrada
 * - nome/matrícula do agente responsável
 * - status
 * - anexos (array de arquivos)
 */
const Vestigio = sequelize.define('Vestigio', {
  codigo: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
  tipo: { type: DataTypes.STRING, allowNull: false },
  numeroLaudo: { type: DataTypes.STRING, allowNull: false },
  numeroProcesso: { type: DataTypes.STRING, allowNull: true },
  descricao: { type: DataTypes.TEXT, allowNull: false },
  origem: { type: DataTypes.STRING, allowNull: false },
  dataEntrada: { type: DataTypes.DATE, allowNull: false },
  responsavelNome: { type: DataTypes.STRING, allowNull: false },
  responsavelMatricula: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.ENUM('em_custodia','em_analise','transferido','arquivado','destruido'), defaultValue: 'em_custodia' },
  catalogacao: { type: DataTypes.STRING, allowNull: true }, // CDU-like
  arquivoNome: { type: DataTypes.STRING, allowNull: true },
  arquivoMime: { type: DataTypes.STRING, allowNull: true },
  arquivoDados: { type: DataTypes.BLOB('long'), allowNull: true }, // binário do arquivo
  anexos: { type: DataTypes.JSON, allowNull: true }, // legado
  codigoNicho: { type: DataTypes.STRING, allowNull: true } // código do nicho no armário 3D
}, {
  tableName: 'vestigios',
  timestamps: true,
  paranoid: true
});

module.exports = Vestigio;
