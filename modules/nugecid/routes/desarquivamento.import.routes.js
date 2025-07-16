const express = require('express');
const router = express.Router();
const desarquivamentoController = require('../controllers/desarquivamentoController');
const { ensureAuthenticated } = require('../../../middlewares/auth');
const upload = require('../../../middleware/upload');
const { csrfProtection } = require('../../../middleware/csrf');

// Rota para exibir o formulário de importação
// GET /nugecid/desarquivamento/importar
router.get('/', ensureAuthenticated, desarquivamentoController.formImportacao);

// Rota para pré-visualizar a planilha (multer antes do csrf)
// POST /nugecid/desarquivamento/importar/preview
router.post('/preview', ensureAuthenticated, upload.single('planilha'), csrfProtection, desarquivamentoController.previewImportacao);

// Rota para confirmar a importação
// POST /nugecid/desarquivamento/importar/confirmar
router.post('/confirmar', ensureAuthenticated, csrfProtection, desarquivamentoController.confirmarImportacao);

module.exports = router;
