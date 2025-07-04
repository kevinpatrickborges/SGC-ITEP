const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { ensureAuthenticated: auth } = require('../middlewares/auth');
const roleRequired = require('../middlewares/roleRequired');
const { body } = require('express-validator');
const checkJwt = require('../middlewares/jwt');
const { validarSenhaCriacaoMiddleware, validarSenhaEdicaoMiddleware } = require('../middlewares/validarSenha');

// Rota para perfil do usuário autenticado
router.get('/perfil', auth, usuariosController.perfilUsuario);
// Rotas legadas (views/admin)
router.get('/', auth, roleRequired(['admin']), usuariosController.listarUsuarios);
router.get('/novo', auth, roleRequired(['admin']), usuariosController.formNovoUsuario);
router.post('/novo', auth, roleRequired(['admin']), validarSenhaCriacaoMiddleware, usuariosController.criarUsuario);
router.get('/:id', auth, roleRequired(['admin']), usuariosController.detalheUsuario);
router.post('/:id/excluir', auth, roleRequired(['admin']), usuariosController.excluirUsuario);

// Rotas para editar usuário
router.get('/:id/editar', auth, roleRequired(['admin']), usuariosController.getEditForm);
router.post('/:id/editar', auth, roleRequired(['admin']), validarSenhaEdicaoMiddleware, usuariosController.postEditForm);

// API RESTful protegida por JWT
router.get('/api/v1/usuarios', checkJwt, usuariosController.apiListarUsuarios);
router.get('/api/v1/usuarios/:id', checkJwt, usuariosController.apiDetalheUsuario);
router.post(
  '/api/v1/usuarios',
  checkJwt,
  [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('role').notEmpty().isIn(['admin','tecnico','auditor']).withMessage('Perfil inválido'),
    ...validarSenhaCriacaoMiddleware
  ],
  usuariosController.apiCriarUsuario
);
router.put(
  '/api/v1/usuarios/:id',
  checkJwt,
  [
    body('nome').optional().notEmpty(),
    body('email').optional().isEmail(),
    body('role').optional().isIn(['admin','tecnico','auditor']),
    body('senha').optional().custom((senha) => {
      if (senha) {
        const erros = require('../middlewares/validarSenha').validarSenha(senha);
        if (erros.length > 0) {
          throw new Error(erros.join(', '));
        }
      }
      return true;
    })
  ],
  usuariosController.apiEditarUsuario
);
router.delete('/api/v1/usuarios/:id', checkJwt, usuariosController.apiExcluirUsuario);

module.exports = router;
