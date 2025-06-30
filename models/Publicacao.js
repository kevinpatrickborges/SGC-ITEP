'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Publicacao = sequelize.define('Publicacao', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tipo: {
    type: DataTypes.ENUM('Livro', 'Artigo', 'Pôster'),
    allowNull: false
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  autores: {
    type: DataTypes.TEXT,
    comment: 'Nomes dos autores, separados por vírgula'
  },
  resumo: {
    type: DataTypes.TEXT
  },
  doi: {
    type: DataTypes.STRING,
    unique: true,
    sparse: true
  },
  isbn: {
    type: DataTypes.STRING,
    unique: true,
    sparse: true
  },
  status: {
    type: DataTypes.ENUM('Rascunho', 'Em Revisão', 'Publicado', 'Arquivado'),
    defaultValue: 'Rascunho'
  },
  autorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fileId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'publicacoes',
  timestamps: true,
  paranoid: true
});

module.exports = Publicacao;
