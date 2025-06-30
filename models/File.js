'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const File = sequelize.define('File', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Caminho relativo do arquivo em /storage'
  },
  mimetype: {
    type: DataTypes.STRING,
    allowNull: false
  },
  size: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  sha256: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
    comment: 'Hash SHA-256 do conteúdo do arquivo para evitar duplicatas'
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  summary: {
    type: DataTypes.TEXT,
    comment: 'Resumo extraído automaticamente do conteúdo (se aplicável)'
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: true // Pode ser nulo se for um arquivo de sistema
  }
}, {
  tableName: 'files',
  timestamps: true,
  paranoid: true
});

module.exports = File;
