// Middleware para autenticação JWT de rotas API RESTful
const jwt = require('jsonwebtoken');

// Verifica se está em produção e se JWT_SECRET está definido
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET deve ser definido em ambiente de produção');
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
};
