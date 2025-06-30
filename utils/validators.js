// Funções de validação e sanitização
const { body } = require('express-validator');

exports.vestigioValidator = [
  body('tipo').notEmpty().withMessage('Tipo obrigatório'),
  body('descricao').notEmpty().withMessage('Descrição obrigatória'),
  body('origem').notEmpty().withMessage('Origem obrigatória'),
  body('numeroLaudo').notEmpty().withMessage('Número do laudo obrigatório'),
  body('dataEntrada').isDate().withMessage('Data inválida'),
  body('responsavelRecebimento').notEmpty().withMessage('Responsável obrigatório')
];

exports.usuarioValidator = [
  body('nome').notEmpty().withMessage('Nome obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('perfil').isIn(['admin', 'tecnico', 'auditor']).withMessage('Perfil inválido')
];
