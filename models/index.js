'use strict';

const fs = require('fs');
const path = require('path');
const { sequelize, testConnection } = require('../config/database');
const legacyAssociations = require('./associations');

const models = {};

// Carrega modelos da pasta raiz 'models'
fs.readdirSync(__dirname)
  .filter(file => file.indexOf('.') !== 0 && file !== 'index.js' && file !== 'associations.js' && file.slice(-3) === '.js')
  .forEach(file => {
    const model = require(path.join(__dirname, file));
    models[model.name] = model;
  });

// Carrega modelos de módulos em 'modules/*'
const modulesDir = path.join(__dirname, '..', 'modules');
fs.readdirSync(modulesDir).forEach(moduleName => {
  const moduleModelsDir = path.join(modulesDir, moduleName, 'models');
  if (fs.existsSync(moduleModelsDir)) {
    fs.readdirSync(moduleModelsDir)
      .filter(file => file.slice(-3) === '.js' && file !== 'associations.js')
      .forEach(file => {
        const model = require(path.join(moduleModelsDir, file));
        models[model.name] = model;
      });
  }
});

// Aplica associações
// Primeiro, as associações legadas
legacyAssociations(models);

// Depois, as associações dos módulos
fs.readdirSync(modulesDir).forEach(moduleName => {
  const associationsFile = path.join(modulesDir, moduleName, 'models', 'associations.js');
  if (fs.existsSync(associationsFile)) {
    const applyModuleAssociations = require(associationsFile);
    if (typeof applyModuleAssociations === 'function') {
      applyModuleAssociations(models);
    }
  }
});

module.exports = { ...models, sequelize, testConnection };
