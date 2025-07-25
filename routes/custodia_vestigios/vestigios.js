const express = require('express');
const router = express.Router();
const vestigiosController = require('../../controllers/custodia_vestigios/vestigiosController');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { body } = require('express-validator');


// Configuração de upload de anexos
const uploadDir = path.join(__dirname, '../../uploads/vestigios');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Apenas PDF, JPG, JPEG e PNG são aceitos.'));
    }
  }
});

const { ensureAuthenticated: auth } = require('../../middlewares/auth');
const roleRequired = require('../../middlewares/roleRequired');

router.get('/', auth, roleRequired(['admin','tecnico','auditor']), vestigiosController.listarVestigios);
router.get('/novo', auth, roleRequired(['admin','tecnico']), vestigiosController.formNovoVestigio);
router.post('/novo', auth, roleRequired(['admin','tecnico']), upload.array('anexos', 5), vestigiosController.criarVestigio);
router.get('/:id', auth, roleRequired(['admin','tecnico','auditor']), vestigiosController.detalheVestigio);
router.post('/:id/delete', auth, roleRequired(['admin']), vestigiosController.deletarVestigio);
router.get('/:id/view3d', auth, roleRequired(['admin','tecnico','auditor']), vestigiosController.view3d);

module.exports = router;
