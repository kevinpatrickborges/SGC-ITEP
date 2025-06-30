const express = require('express');
const router = express.Router();
const relatoriosController = require('../controllers/relatoriosController');
const { ensureAuthenticated: auth } = require('../middlewares/auth');
const { body } = require('express-validator');
const checkJwt = require('../middlewares/jwt');

// API RESTful para geração de relatórios
const roleRequired = require('../middlewares/roleRequired');

router.post(
  '/api/v1/relatorios',
  auth,
  roleRequired(['admin','auditor']),
  checkJwt,
  [
    body('tipo').notEmpty().isIn(['vestigios','usuarios']).withMessage('Tipo de relatório inválido'),
    body('formato').notEmpty().isIn(['pdf','excel']).withMessage('Formato inválido')
  ],
  relatoriosController.apiGerarRelatorio
);

module.exports = router;
