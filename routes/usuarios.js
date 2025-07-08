const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { ensureAuthenticated: auth } = require('../middlewares/auth');
const roleRequired = require('../middlewares/roleRequired');
const checkJwt = require('../middlewares/jwt');

// Importa os validadores do controller
const { validateNewUser, validateUpdateUser } = usuariosController;

// Rota para perfil do usuário autenticado
router.get('/perfil', auth, usuariosController.perfilUsuario);

// Rotas de administração de usuários (views)
router.get('/', auth, roleRequired(['admin']), usuariosController.listarUsuarios);
router.get('/novo', auth, roleRequired(['admin']), usuariosController.formNovoUsuario);
router.post('/novo', auth, roleRequired(['admin']), validateNewUser, usuariosController.criarUsuario);
router.get('/:id', auth, roleRequired(['admin']), usuariosController.detalheUsuario);
router.post('/:id/excluir', auth, roleRequired(['admin']), usuariosController.excluirUsuario);

// Rotas para editar usuário
router.get('/:id/editar', auth, roleRequired(['admin']), usuariosController.getEditForm);
router.post('/:id/editar', auth, roleRequired(['admin']), validateUpdateUser, usuariosController.postEditForm);

// API RESTful protegida por JWT
router.get('/api/v1/usuarios', checkJwt, usuariosController.apiListarUsuarios);
router.get('/api/v1/usuarios/:id', checkJwt, usuariosController.apiDetalheUsuario);
router.post('/api/v1/usuarios', checkJwt, validateNewUser, usuariosController.apiCriarUsuario);
router.put('/api/v1/usuarios/:id', checkJwt, validateUpdateUser, usuariosController.apiEditarUsuario);
router.delete('/api/v1/usuarios/:id', checkJwt, usuariosController.apiExcluirUsuario);

module.exports = router;
