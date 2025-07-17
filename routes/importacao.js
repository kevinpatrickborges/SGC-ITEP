const express = require('express');
const router = express.Router();
const importacaoController = require('../controllers/importacaoController');
const { ensureAuthenticated: auth } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const { body } = require('express-validator');
const checkJwt = require('../middlewares/jwt');

// Configuração de upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// API RESTful para importação de planilhas
const roleRequired = require('../middlewares/roleRequired');

// Tela de importação
router.get('/importacao', auth, roleRequired(['admin','tecnico']), importacaoController.formImportacaoDesarquivamento);
// Upload e preview
router.post('/importacao', auth, roleRequired(['admin','tecnico']), upload.single('arquivo'), importacaoController.previewImportacaoDesarquivamento);
// Confirmação da importação
router.post('/importacao/confirmar', auth, roleRequired(['admin','tecnico']), importacaoController.confirmarImportacaoDesarquivamento);

/*
// API (mantida para integrações externas) - Comentado pois a função 'apiImportarPlanilha' não foi encontrada no controller.
router.post(
  '/api/v1/importacao',
  auth,
  roleRequired(['admin','tecnico']),
  checkJwt,
  upload.single('arquivo'),
  [
    body('tipo').notEmpty().isIn(['vestigios','usuarios']).withMessage('Tipo de importação inválido')
  ],
  importacaoController.apiImportarPlanilha
);
*/

module.exports = router;
