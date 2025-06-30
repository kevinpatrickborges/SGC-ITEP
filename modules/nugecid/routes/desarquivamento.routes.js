const express = require('express');
const router = express.Router();
const { csrfProtection } = require('../../../middleware/csrf');
const desarquivamentoController = require('../controllers/desarquivamentoController');
// const { checkAuth, checkRole } = require('../../../middleware/auth'); // Middleware de autenticação para o futuro

// @route   GET /nugecid/desarquivamento
// @desc    Listar todos os desarquivamentos
router.get('/', /*checkAuth,*/ desarquivamentoController.getList);

// @route   GET /nugecid/desarquivamento/novo
// @desc    Exibir formulário de novo desarquivamento
router.get('/novo', /*checkAuth,*/ desarquivamentoController.getForm);

// @route   POST /nugecid/desarquivamento/novo
// @desc    Processar criação de novo desarquivamento
router.post('/novo', /*checkAuth,*/ desarquivamentoController.postNewForm);

// @route   GET /nugecid/desarquivamento/:id/editar
// @desc    Exibir formulário de edição de desarquivamento
router.get('/:id/editar', /*checkAuth,*/ desarquivamentoController.getEditForm);

// @route   POST /nugecid/desarquivamento/:id/editar
// @desc    Processar edição de desarquivamento
router.post('/:id/editar', /*checkAuth,*/ desarquivamentoController.postEditForm);

// @route   POST /nugecid/desarquivamento/:id/excluir
// @desc    Excluir (soft delete) um desarquivamento
router.post('/:id/excluir', /*checkAuth,*/ desarquivamentoController.deleteItem);

// @route   PATCH /nugecid/desarquivamento/:id/atualizar-campo
// @desc    Atualizar um campo específico de um registro (edição inline)
router.patch('/:id/atualizar-campo', /*checkAuth,*/ desarquivamentoController.patchUpdateField);

// --- ROTAS DE IMPORTAÇÃO ---
// @route   GET /nugecid/desarquivamento/importar
// @desc    Exibir formulário de importação
router.get('/importar', desarquivamentoController.getImportForm);

// Rota para processar a importação do arquivo.
// A proteção CSRF é aplicada manualmente aqui, após o multer,
// porque a proteção global foi configurada para ignorar esta rota.
const upload = require('../../../middleware/upload');
router.post('/importar', upload.single('arquivo'), csrfProtection, desarquivamentoController.postImport);

// @route   POST /nugecid/desarquivamento/importar/confirmar
// @desc    Confirmar e salvar os dados da importação
router.post('/importar/confirmar', /*checkAuth,*/ desarquivamentoController.postConfirmImport);

// --- ROTAS DE EXPORTAÇÃO ---
// @route   GET /nugecid/desarquivamento/exportar/xlsx
// @desc    Exportar dados para XLSX
router.get('/exportar/xlsx', /*checkAuth,*/ desarquivamentoController.exportXLSX);

// @route   GET /nugecid/desarquivamento/exportar/pdf
// @desc    Exportar dados para PDF
router.get('/exportar/pdf', /*checkAuth,*/ desarquivamentoController.exportPDF);

module.exports = router;
