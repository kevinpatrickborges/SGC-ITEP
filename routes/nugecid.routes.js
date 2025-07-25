'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/nugecidController'); // Controller unificado
const { ensureAuthenticated, checkRole } = require('../middlewares/auth');
const multer = require('multer');

// Middlewares de permissão
const canEditNugecid = checkRole(['admin', 'NUGECID_EDITOR', 'tecnico', 'auditor']);
const canViewNugecid = checkRole(['admin', 'NUGECID_EDITOR', 'auditor', 'tecnico']);
const isAdmin = checkRole(['admin']); // Apenas para ações mais restritas

// Configuração do Multer para upload de arquivos em memória
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- ROTAS PRINCIPAIS (rotas específicas primeiro) ---
router.get('/', ensureAuthenticated, canViewNugecid, controller.getList);
router.get('/novo', ensureAuthenticated, canEditNugecid, controller.getForm);
router.post('/novo', ensureAuthenticated, canEditNugecid, controller.postNewForm);

// --- ROTAS DE IMPORTAÇÃO E EXPORTAÇÃO ---
router.get('/importar', ensureAuthenticated, canEditNugecid, controller.getImportForm);
router.post('/importar', ensureAuthenticated, canEditNugecid, upload.single('arquivo'), controller.postImport);
router.post('/importar/confirmar', ensureAuthenticated, canEditNugecid, controller.postConfirmImport);
router.get('/exportar/xlsx', ensureAuthenticated, canViewNugecid, controller.exportXLSX);
router.get('/exportar/pdf', ensureAuthenticated, canViewNugecid, controller.exportPDF);

// --- ROTAS DA LIXEIRA (ANTIGO ARQUIVO MORTO) ---
router.get('/lixeira', ensureAuthenticated, isAdmin, controller.getLixeira);
router.post('/lixeira/:id/restaurar', ensureAuthenticated, isAdmin, controller.restaurarItem);
router.post('/lixeira/:id/excluir-permanente', ensureAuthenticated, isAdmin, controller.excluirPermanentemente);
router.post('/lixeira/esvaziar', ensureAuthenticated, isAdmin, controller.esvaziarLixeira);

// --- ROTAS DE TERMO (rotas específicas antes das com parâmetros) ---
router.get('/termo/selecionar', ensureAuthenticated, canViewNugecid, controller.getSelecaoTermo);
router.post('/termo/preparar', ensureAuthenticated, canViewNugecid, controller.prepararTermo);
router.post('/termo/gerar', ensureAuthenticated, canViewNugecid, controller.gerarTermoEmMassa);
router.post('/termo/visualizar', ensureAuthenticated, canViewNugecid, controller.visualizarTermo);
router.get('/termo/conteudo-html', ensureAuthenticated, canViewNugecid, controller.obterConteudoTermoHTML);
router.post('/termo/baixar-docx', ensureAuthenticated, canViewNugecid, controller.baixarTermoDOCX);
router.post('/termo/exportar-pdf', ensureAuthenticated, canViewNugecid, controller.exportarTermoPDF);
router.post('/termo/exportar-docx', ensureAuthenticated, canViewNugecid, controller.exportarTermoDOCX);
router.post('/termo/gerar-editado', ensureAuthenticated, canViewNugecid, controller.gerarTermoEditado);
router.post('/termo/salvar-edicao', ensureAuthenticated, canEditNugecid, controller.salvarEdicaoTermo);
router.get('/termo/criar-template', ensureAuthenticated, canEditNugecid, controller.exibirFormularioTemplate);
router.post('/termo/criar-template', ensureAuthenticated, canEditNugecid, controller.criarTemplatePersonalizado);

// Rota para visualizar PDF
router.get('/pdf/visualizar/:filename', ensureAuthenticated, canViewNugecid, controller.visualizarPDF);

// Rota para servir arquivo PDF
router.get('/pdf/arquivo/:filename', ensureAuthenticated, canViewNugecid, controller.servirArquivoPDF);

// Rota para listar templates PDF
router.get('/templates', ensureAuthenticated, canViewNugecid, controller.listarTemplatesPDF);

// Rotas para preenchimento de templates
router.get('/preencher-template/:filename', ensureAuthenticated, canViewNugecid, controller.exibirPreenchimentoTemplate);
router.post('/preencher-template/:filename', ensureAuthenticated, canEditNugecid, controller.processarPreenchimentoTemplate);

// --- OUTRAS ROTAS ---
router.post('/status/:id', ensureAuthenticated, canEditNugecid, controller.updateStatus);
router.post('/mover-todos-para-lixeira', ensureAuthenticated, isAdmin, controller.moverTodosParaLixeira);

// --- ROTAS COM PARÂMETROS (devem vir por último) ---
router.get('/:id/detalhes', ensureAuthenticated, canViewNugecid, controller.getDetalhes);
router.get('/:id/editar', ensureAuthenticated, canEditNugecid, controller.getEditForm);
router.post('/:id/editar', ensureAuthenticated, canEditNugecid, controller.postEditForm);
router.post('/:id/excluir', ensureAuthenticated, canEditNugecid, controller.deleteItem);

module.exports = router;
