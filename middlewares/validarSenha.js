const { body, validationResult } = require('express-validator');

// Função para validar senha forte
function validarSenha(senha) {
  const minLength = 8;
  const temMaiuscula = /[A-Z]/.test(senha);
  const temMinuscula = /[a-z]/.test(senha);
  const temNumero = /[0-9]/.test(senha);
  const temEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(senha);

  const erros = [];
  
  if (senha.length < minLength) {
    erros.push('A senha deve ter pelo menos 8 caracteres');
  }
  if (!temMaiuscula || !temMinuscula) {
    erros.push('A senha deve conter letras maiúsculas e minúsculas');
  }
  if (!temNumero) {
    erros.push('A senha deve conter números');
  }
  if (!temEspecial) {
    erros.push('A senha deve conter caracteres especiais');
  }

  return erros;
}

// Middleware para validação de senha na CRIAÇÃO de usuário (obrigatório)
const validarSenhaCriacaoMiddleware = [
  body('senha')
    .notEmpty().withMessage('A senha é obrigatória')
    .custom((senha) => {
      const erros = validarSenha(senha);
      if (erros.length > 0) {
        throw new Error(erros.join(', '));
      }
      return true;
    })
];

// Middleware para validação de senha na EDIÇÃO de usuário (opcional)
const validarSenhaEdicaoMiddleware = [
  body('senha')
    .if(body('senha').notEmpty()) // Só valida se o campo não estiver vazio
    .custom((senha) => {
      const erros = validarSenha(senha);
      if (erros.length > 0) {
        throw new Error(erros.join(', '));
      }
      return true;
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error_msg', errors.array().map(e => e.msg).join(', '));
      return res.redirect(req.header('Referer') || '/');
    }
    next();
  }
];

module.exports = {
  validarSenha,
  validarSenhaCriacaoMiddleware,
  validarSenhaEdicaoMiddleware
}; 