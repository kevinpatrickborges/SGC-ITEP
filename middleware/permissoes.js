// Middleware para controle de permissões por perfil
module.exports = {
  requireAdmin: (req, res, next) => {
    if (req.user && req.user.perfil === 'admin') return next();
    req.flash('error_msg', 'Acesso restrito a administradores.');
    res.redirect('/');
  },
  requireTecnico: (req, res, next) => {
    if (req.user && (req.user.perfil === 'tecnico' || req.user.perfil === 'admin')) return next();
    req.flash('error_msg', 'Acesso restrito a técnicos ou administradores.');
    res.redirect('/');
  },
  requireAuditor: (req, res, next) => {
    if (req.user && (req.user.perfil === 'auditor' || req.user.perfil === 'admin')) return next();
    req.flash('error_msg', 'Acesso restrito a auditores ou administradores.');
    res.redirect('/');
  }
};
