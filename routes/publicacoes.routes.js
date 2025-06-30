'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/publicacoesController');
const { ensureAuthenticated: auth } = require('../middlewares/auth');
const roleRequired = require('../middlewares/roleRequired');

// Permissões: Apenas admins e técnicos podem gerenciar publicações
const canManagePublicacoes = roleRequired(['admin', 'tecnico']);

// Rota para listar todas as publicações
router.get('/', auth, controller.listar);

// Rotas para criar uma nova publicação
router.get('/novo', auth, canManagePublicacoes, controller.mostrarFormulario);
router.post('/novo', auth, canManagePublicacoes, controller.salvar);

// Rotas para editar uma publicação
router.get('/editar/:id', auth, canManagePublicacoes, controller.mostrarFormulario);
router.post('/editar/:id', auth, canManagePublicacoes, controller.salvar);

// Rota para deletar (arquivar) uma publicação
router.post('/deletar/:id', auth, canManagePublicacoes, controller.deletar);

module.exports = router;
