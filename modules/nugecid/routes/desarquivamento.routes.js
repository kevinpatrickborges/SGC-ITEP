const express = require('express');
const router = express.Router();
const desarquivamentoController = require('../controllers/desarquivamentoController');
const { ensureAuthenticated } = require('../../../middlewares/auth');

router.get('/', ensureAuthenticated, desarquivamentoController.getAll);
router.post('/', ensureAuthenticated, desarquivamentoController.create);
router.get('/:id', ensureAuthenticated, desarquivamentoController.getById);
router.put('/:id', ensureAuthenticated, desarquivamentoController.update);
router.delete('/:id', ensureAuthenticated, desarquivamentoController.delete);
router.get('/:id/termo', ensureAuthenticated, desarquivamentoController.gerarTermo);

module.exports = router;
