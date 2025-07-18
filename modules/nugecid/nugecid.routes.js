'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/desarquivamentoController');
const { ensureAuthenticated, checkRole } = require('../../middlewares/auth'); // Supondo que o middleware de auth esteja neste caminho

// Middleware para verificar permissões do NUGECID
const canEditNugecid = checkRole(['admin', 'NUGECID_EDITOR']);
const canViewNugecid = checkRole(['admin', 'NUGECID_EDITOR', 'auditor']);

// Rota principal - Lista de desarquivamentos
router.get('/desarquivamento', ensureAuthenticated, canViewNugecid, controller.getList);

// Rota para ver os detalhes de um registro
router.get('/desarquivamento/:id', ensureAuthenticated, canViewNugecid, controller.getDetalhes);

// Rotas para criar um novo registro
router.get('/novo', ensureAuthenticated, canEditNugecid, controller.getForm);
router.post('/novo', ensureAuthenticated, canEditNugecid, controller.postNewForm);

// Rotas para editar um registro
router.get('/editar/:id', ensureAuthenticated, canEditNugecid, controller.getEditForm);
router.post('/editar/:id', ensureAuthenticated, canEditNugecid, controller.postEditForm);

// Rota para deletar (cancelar) um registro
router.post('/deletar/:id', ensureAuthenticated, canEditNugecid, controller.deleteItem);

// Rotas de exportação
router.get('/desarquivamento/exportar/xlsx', ensureAuthenticated, canViewNugecid, controller.exportXLSX);
router.get('/desarquivamento/exportar/pdf', ensureAuthenticated, canViewNugecid, controller.exportPDF);

// Rota para a lixeira
router.get('/lixeira', ensureAuthenticated, canEditNugecid, controller.getLixeira);
router.post('/lixeira/:id/restaurar', ensureAuthenticated, canEditNugecid, controller.restaurarItem);
router.post('/lixeira/:id/excluir-permanente', ensureAuthenticated, canEditNugecid, controller.excluirPermanentemente);

// Rota para atualização de status via AJAX
router.post('/status/:id', ensureAuthenticated, canEditNugecid, controller.updateStatus);

// Rota para esvaziar a lixeira
router.post('/lixeira/excluir-todos', ensureAuthenticated, canEditNugecid, controller.esvaziarLixeira);

// Rota para mover todos os registros para a lixeira
router.post('/desarquivamento/mover-todos-para-lixeira', ensureAuthenticated, canEditNugecid, controller.moverTodosParaLixeira);

// Rotas para geração de termo com múltiplos registros
router.get('/termo/selecionar', ensureAuthenticated, canViewNugecid, controller.getSelecaoTermo);
router.post('/termo/gerar', ensureAuthenticated, canViewNugecid, controller.gerarTermoEmMassa);
router.post('/termo/visualizar', ensureAuthenticated, canViewNugecid, controller.visualizarTermo);


module.exports = router;
