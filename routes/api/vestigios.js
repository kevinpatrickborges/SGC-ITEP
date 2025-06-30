const express = require('express');
const router = express.Router();
const vestigiosController = require('../../controllers/vestigiosController');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { body } = require('express-validator');
const checkJwt = require('../../middlewares/jwt');

// Configuração de upload de anexos
// Garante que a pasta de uploads existe
const uploadDir = path.join(__dirname, '../../uploads/vestigios');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/vestigios'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage });

// API RESTful protegida por JWT
router.get('/', checkJwt, vestigiosController.apiListarVestigios);
router.get('/:id', checkJwt, vestigiosController.apiDetalheVestigio);
router.post(
  '/',
  checkJwt,
  upload.array('anexos', 5),
  [
    body('tipo').notEmpty().withMessage('Tipo é obrigatório'),
    body('descricao').notEmpty().withMessage('Descrição é obrigatória'),
    body('origem').notEmpty().withMessage('Origem é obrigatória'),
    body('dataEntrada').notEmpty().isISO8601().withMessage('Data de entrada inválida'),
    body('responsavelNome').notEmpty().withMessage('Responsável é obrigatório'),
    body('responsavelMatricula').notEmpty().withMessage('Matrícula do responsável é obrigatória')
  ],
  vestigiosController.apiCriarVestigio
);
router.put(
  '/:id',
  checkJwt,
  [
    body('tipo').optional().notEmpty(),
    body('descricao').optional().notEmpty(),
    body('origem').optional().notEmpty(),
    body('dataEntrada').optional().isISO8601(),
    body('responsavelNome').optional().notEmpty(),
    body('responsavelMatricula').optional().notEmpty()
  ],
  vestigiosController.apiEditarVestigio
);
router.delete('/:id', checkJwt, vestigiosController.apiExcluirVestigio);

module.exports = router;
