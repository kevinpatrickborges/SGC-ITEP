'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/arquivoMortoController');
const { ensureAuthenticated: auth } = require('../middlewares/auth');
const roleRequired = require('../middlewares/roleRequired');

// Apenas administradores podem gerenciar o arquivo morto
const isAdmin = roleRequired(['admin']);

// Rota para listar todos os itens arquivados
router.get('/', auth, isAdmin, controller.listarArquivados);

// Rota para restaurar um item
router.post('/restaurar/:model/:id', auth, isAdmin, controller.restaurar);

// Rota para deletar permanentemente um item
router.post('/deletar/:model/:id', auth, isAdmin, controller.deletarPermanentemente);

module.exports = router;
