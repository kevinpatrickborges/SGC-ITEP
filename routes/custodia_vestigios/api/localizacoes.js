const express = require('express');
const router = express.Router();
const localizacoesController = require('../../../controllers/custodia_vestigios/localizacoesController');
const checkJwt = require('../../../middlewares/jwt');

router.get('/', checkJwt, localizacoesController.apiListarLocalizacoes);
router.get('/:id', checkJwt, localizacoesController.apiDetalheLocalizacao);

module.exports = router;
