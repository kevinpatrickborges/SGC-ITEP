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

// Middleware de validação de senha
const validarSenhaMiddleware = [
  body('senha')
    .notEmpty().withMessage('A senha é obrigatória')
    .custom((senha) => {
      const erros = validarSenha(senha);
      if (erros.length > 0) {
        throw new Error(erros.join(', '));
      }
      return true;
    }),
  
  // Middleware para processar os resultados da validação
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(400).json({ errors: errors.array() });
      }
      req.flash('error_msg', errors.array().map(e => e.msg).join(', '));
      return res.redirect('back');
    }
    next();
  }
];

module.exports = {
  validarSenha,
  validarSenhaMiddleware
}; 