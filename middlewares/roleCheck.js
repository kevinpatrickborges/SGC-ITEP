// Middleware para checar permissões de usuário baseado em perfil
module.exports = function(requiredRoles) {
  return function(req, res, next) {
    const usuario = req.user;
    if (!usuario || !requiredRoles.includes(usuario.perfil)) {
      return res.status(403).json({ error: 'Acesso negado: permissão insuficiente' });
    }
    next();
  };
};
