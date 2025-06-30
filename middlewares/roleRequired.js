// Middleware para exigir papel específico
module.exports = function(requiredRoles) {
  return async function(req, res, next) {
    const usuario = req.user || req.session?.user;
    
    if (!usuario) {
      if (!req.originalUrl.startsWith('/api/')) {
        req.flash('error_msg', 'Você precisa estar logado.');
        return res.redirect('/auth/login');
      }
      return res.status(403).json({ error: 'Acesso negado: não autenticado' });
    }

    // Verifica se o usuário tem o papel necessário
    const temPermissao = 
      // Verifica role.nome (novo formato)
      (usuario.role && requiredRoles.includes(usuario.role.nome)) ||
      // Verifica role direto (formato legado)
      (usuario.role && requiredRoles.includes(usuario.role)) ||
      // Verifica perfil (formato legado)
      (usuario.perfil && requiredRoles.includes(usuario.perfil));

    if (temPermissao) {
      return next();
    }

    // Se não tem permissão direta, verifica roleId
    if (usuario.roleId) {
      try {
        const Role = require('../models/Role');
        const role = await Role.findByPk(usuario.roleId);
        
        if (role && requiredRoles.includes(role.nome)) {
          return next();
        }
      } catch (err) {
        return res.status(500).json({ error: 'Erro ao verificar permissões' });
      }
    }

    // Se chegou aqui, não tem permissão
    if (!req.originalUrl.startsWith('/api/')) {
      req.flash('error_msg', 'Você não tem permissão para acessar esta página.');
      return res.redirect('/dashboard');
    }
    return res.status(403).json({ error: 'Acesso negado: permissão insuficiente' });
  };
};
