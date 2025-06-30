// Middleware para checar perfil de usuário
module.exports = function (roles = []) {
  return (req, res, next) => {
    if (!req.session.user || !roles.includes(req.session.user.perfil)) {
      req.flash('error_msg', res.__('Acesso negado.'));
      return res.redirect('/');
    }
    next();
  };
};
