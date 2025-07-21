const express = require('express');
const router = express.Router();
const viewerController = require('../controllers/viewerController');
const uploadDocx = require('../middleware/uploadDocx'); // Middleware específico para DOCX
const roleRequired = require('../middlewares/roleRequired');
const { csrfProtection } = require('../middleware/csrf');

// Rota para exibir a página do visualizador
router.get('/', roleRequired(['admin', 'tecnico']), viewerController.showViewer);

// Rota para fazer upload e exibir o conteúdo do DOCX
// CSRF protection é pulada globalmente para esta rota no middleware/csrf.js
router.post('/upload', roleRequired(['admin', 'tecnico']), uploadDocx.single('docxFile'), viewerController.uploadAndDisplay);

// Rota para exibir o termo de desarquivamento gerado
router.get('/termo', roleRequired(['admin', 'tecnico']), viewerController.displayTermo);

module.exports = router;