const express = require('express');
const router = express.Router();
const desarquivamentoController = require('../controllers/desarquivamentoController');
const { ensureAuthenticated } = require('../../../middlewares/auth');
const upload = require('../../../middleware/upload');

// Rotas mais específicas primeiro
router.get('/', ensureAuthenticated, desarquivamentoController.getAll);
router.get('/novo', ensureAuthenticated, desarquivamentoController.formNovo);
router.post('/', ensureAuthenticated, desarquivamentoController.create);
router.get('/lixeira', ensureAuthenticated, desarquivamentoController.getLixeira);
router.post('/lixeira/esvaziar', ensureAuthenticated, desarquivamentoController.esvaziarLixeira);
router.post('/delete-all', ensureAuthenticated, desarquivamentoController.apagarTodos);

// Rotas com parâmetros (mais genéricas) depois
router.get('/:id', ensureAuthenticated, desarquivamentoController.getById);
router.put('/:id', ensureAuthenticated, desarquivamentoController.update);
router.delete('/:id', ensureAuthenticated, desarquivamentoController.delete);
router.get('/:id/termo', ensureAuthenticated, desarquivamentoController.gerarTermo);
router.post('/:id/status', ensureAuthenticated, desarquivamentoController.updateStatus);
router.post('/:id/restaurar', ensureAuthenticated, desarquivamentoController.restaurar);
router.delete('/:id/force', ensureAuthenticated, desarquivamentoController.forcarDelete);


module.exports = router;
