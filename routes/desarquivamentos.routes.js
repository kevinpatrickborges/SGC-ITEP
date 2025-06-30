const express = require('express');
const router = express.Router();

const multer = require('multer');
const { getList, getForm, postNewForm, getEditForm, postEditForm, deleteItem, getImportForm, postImport, postConfirmImport, updateStatus, exportXLSX, exportPDF } = require('../controllers/desarquivamentoController');
// const { checkRole } = require('../middleware/acl');



// Configuração do Multer para upload de arquivos em memória
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rotas Web para o Módulo NUGECID
// O middleware csrfProtection é aplicado individualmente para controlar a ordem com multer

// Rota para a lista de desarquivamentos
router.get('/', getList);

// Rotas para criar um NOVO desarquivamento
router.get('/novo', getForm);
router.post('/novo', postNewForm);

// Rotas para EDITAR um desarquivamento existente
router.get('/:id/editar', getEditForm);
router.post('/:id/editar', postEditForm);
router.post('/:id/excluir', deleteItem);

// Rotas para IMPORTAÇÃO de planilha
router.get('/importar', getImportForm);

router.post('/importar', upload.single('arquivo'), postImport);
router.post('/importar/confirmar', postConfirmImport);

// Rota para atualização de status via AJAX
router.post('/status/:id', updateStatus);

// Rotas para exportação
router.get('/exportar/xlsx', exportXLSX);
router.get('/exportar/pdf', exportPDF);

module.exports = router;
