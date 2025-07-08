const express = require('express');
const router = express.Router();
const localizacoesController = require('../controllers/localizacoesController');

// Listar locais
const { ensureAuthenticated: auth } = require('../middlewares/auth');
const roleRequired = require('../middlewares/roleRequired');

// Importa os validadores
const { validateNewLocalizacao, validateUpdateLocalizacao } = localizacoesController;

router.get('/', auth, roleRequired(['admin','tecnico','auditor']), localizacoesController.listarLocalizacoes);
router.get('/novo', auth, roleRequired(['admin','tecnico']), localizacoesController.formNovaLocalizacao);
router.post('/novo', auth, roleRequired(['admin','tecnico']), validateNewLocalizacao, localizacoesController.criarLocalizacao);
router.get('/:id', auth, roleRequired(['admin','tecnico','auditor']), localizacoesController.detalheLocalizacao);
router.post('/:id/delete', auth, roleRequired(['admin','tecnico']), localizacoesController.deletarLocalizacao);

// Rotas para editar localização
router.get('/:id/editar', auth, roleRequired(['admin','tecnico']), localizacoesController.getEditForm);
router.post('/:id/editar', auth, roleRequired(['admin','tecnico']), validateUpdateLocalizacao, localizacoesController.postEditLocalizacao);

// Visualização 3D da localização
router.get('/:id/view3d', auth, roleRequired(['admin','tecnico','auditor']), localizacoesController.view3D);

module.exports = router;
