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

// @route   GET /nugecid/desarquivamento/:id/recibo
// @desc    Gerar recibo de retirada em PDF
router.get('/:id/recibo', /*checkAuth,*/ desarquivamentoController.gerarRecibo);

// @route   PATCH /nugecid/desarquivamento/:id/atualizar-campo
// @desc    Atualizar um campo específico de um registro (edição inline)
router.patch('/:id/atualizar-campo', /*checkAuth,*/ desarquivamentoController.patchUpdateField);

// @route   POST /nugecid/desarquivamento/:id/prorrogar-prazo
// @desc    Prorrogar o prazo de um desarquivamento
router.post('/:id/prorrogar-prazo', /*checkAuth,*/ desarquivamentoController.prorrogarPrazo);

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

// @route   POST /nugecid/desarquivamento/apagar-todos
// @desc    Apagar todos os registros de desarquivamento (admin)
router.post('/apagar-todos', /*checkAuth,*/ csrfProtection, desarquivamentoController.apagarTodos);

// --- ROTAS DA LIXEIRA ---
// @route   GET /nugecid/desarquivamento/lixeira
// @desc    Exibir itens na lixeira
router.get('/lixeira', /*checkAuth,*/ desarquivamentoController.getTrashList);

// @route   POST /nugecid/desarquivamento/:id/restaurar
// @desc    Restaurar um item da lixeira
router.post('/:id/restaurar', /*checkAuth,*/ csrfProtection, desarquivamentoController.restoreItem);

// @route   POST /nugecid/desarquivamento/:id/excluir-permanente
// @desc    Excluir permanentemente um item da lixeira
router.post('/:id/excluir-permanente', /*checkAuth,*/ csrfProtection, desarquivamentoController.deletePermanent);

// @route   POST /nugecid/desarquivamento/esvaziar-lixeira
// @desc    Esvaziar a lixeira (excluir todos permanentemente)
router.post('/esvaziar-lixeira', /*checkAuth,*/ csrfProtection, desarquivamentoController.emptyTrash);

module.exports = router;
