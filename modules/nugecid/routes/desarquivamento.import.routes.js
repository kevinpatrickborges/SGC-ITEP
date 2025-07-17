const express = require('express');
const router = express.Router();
const importacaoController = require('../../../controllers/importacaoController');
const { ensureAuthenticated } = require('../../../middlewares/auth');
const upload = require('../../../middleware/upload');
const { csrfProtection } = require('../../../middleware/csrf');

// Rota para exibir o formulário de importação (precisa de csrfProtection para gerar o token)
// GET /nugecid/desarquivamento/importar
router.get('/', ensureAuthenticated, csrfProtection, importacaoController.formImportacaoDesarquivamento);

// Rota para pré-visualizar a planilha (multer antes do csrf)
// POST /nugecid/desarquivamento/importar/preview
router.post('/preview', ensureAuthenticated, upload.single('planilha'), csrfProtection, importacaoController.previewImportacaoDesarquivamento);

// Rota para confirmar a importação
// POST /nugecid/desarquivamento/importar/confirmar
router.post('/confirmar', ensureAuthenticated, csrfProtection, importacaoController.confirmarImportacaoDesarquivamento);

module.exports = router;
