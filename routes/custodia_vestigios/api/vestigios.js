const express = require('express');
const router = express.Router();
const vestigiosController = require('../../../controllers/custodia_vestigios/vestigiosController');
const multer = require('multer');
const path = require('path');
const { body } = require('express-validator');
const checkJwt = require('../../../middlewares/jwt');

const upload = multer({ dest: path.join(__dirname, '../../../uploads/vestigios') });

router.get('/', checkJwt, vestigiosController.apiListarVestigios);
router.get('/:id', checkJwt, vestigiosController.apiDetalheVestigio);
router.post('/', checkJwt, upload.array('anexos', 5), [
    body('tipo').notEmpty(),
    body('descricao').notEmpty(),
    body('origem').notEmpty(),
    body('dataEntrada').isISO8601(),
    body('responsavelNome').notEmpty(),
    body('responsavelMatricula').notEmpty()
], vestigiosController.apiCriarVestigio);
router.put('/:id', checkJwt, vestigiosController.apiEditarVestigio);
router.delete('/:id', checkJwt, vestigiosController.apiExcluirVestigio);

module.exports = router;
