const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Prontuario = sequelize.define('Prontuario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  numProntuario: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Número único do prontuário ou processo.'
  },
  nomePrincipal: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nome da pessoa principal associada ao prontuário.'
  },
  localizacaoFisica: {
    type: DataTypes.STRING,
    comment: 'Ex: Armário A, Gaveta 3'
  },
  digitalizadoEm: {
    type: DataTypes.DATE,
    comment: 'Data em que a digitalização foi concluída.'
  },
  status: {
    type: DataTypes.ENUM('Disponível', 'Emprestado', 'Em Digitalização', 'Pendente', 'Descartado'),
    defaultValue: 'Disponível',
    allowNull: false,
  },
}, {
  tableName: 'NugecidProntuarios',
  timestamps: true,
  paranoid: true,
});

module.exports = Prontuario;
