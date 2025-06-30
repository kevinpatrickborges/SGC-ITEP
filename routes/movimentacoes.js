const express = require('express');
const router = express.Router();
const movimentacoesController = require('../controllers/movimentacoesController');
const multer = require('multer');
const path = require('path');

// Configuração de upload de termo/anexo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/movimentacoes'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage });

// Listar movimentações de um vestígio
const { ensureAuthenticated: auth } = require('../middlewares/auth');
const roleRequired = require('../middlewares/roleRequired');

router.get('/vestigio/:vestigioId', auth, roleRequired(['admin','tecnico','auditor']), movimentacoesController.listarMovimentacoesVestigio);
router.get('/vestigio/:vestigioId/nova', auth, roleRequired(['admin','tecnico']), movimentacoesController.formNovaMovimentacao);
router.post('/vestigio/:vestigioId/nova', auth, roleRequired(['admin','tecnico']), upload.single('anexo'), movimentacoesController.criarMovimentacao);

module.exports = router;
