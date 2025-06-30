'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./nugecid.controller');
const { ensureAuthenticated, checkRole } = require('../../middlewares/auth'); // Supondo que o middleware de auth esteja neste caminho

// Middleware para verificar permissões do NUGECID
const canEditNugecid = checkRole(['admin', 'NUGECID_EDITOR']);
const canViewNugecid = checkRole(['admin', 'NUGECID_EDITOR', 'auditor']);

// Rota principal - Lista de desarquivamentos
router.get('/', ensureAuthenticated, canViewNugecid, controller.listar);

// Rotas para criar um novo registro
router.get('/novo', ensureAuthenticated, canEditNugecid, controller.mostrarFormularioNovo);
router.post('/novo', ensureAuthenticated, canEditNugecid, controller.criar);

// Rotas para editar um registro
router.get('/editar/:id', ensureAuthenticated, canEditNugecid, controller.mostrarFormularioEditar);
router.post('/editar/:id', ensureAuthenticated, canEditNugecid, controller.editar);

// Rota para deletar (cancelar) um registro
router.post('/deletar/:id', ensureAuthenticated, canEditNugecid, controller.deletar);

module.exports = router;
