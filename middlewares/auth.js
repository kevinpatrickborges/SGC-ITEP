/**
 * Middleware para garantir que o usuário está autenticado.
 * Redireciona para a página de login se não estiver.
 */
function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error_msg', 'Você precisa estar logado para ver esta página.');
  res.redirect('/auth/login');
}

/**
 * Middleware de ordem superior para verificar a role do usuário.
 * @param {string[]} roles - Um array de nomes de roles permitidas.
 * @returns {function} - Um middleware para ser usado nas rotas.
 */
const checkRole = (roles) => {
  return async (req, res, next) => {
    // O middleware ensureAuthenticated deve ser executado antes.
    if (!req.session.user) {
      req.flash('error_msg', 'Acesso negado. Faça login primeiro.');
      return res.status(403).redirect('/auth/login');
    }

    try {
      // Carrega os modelos aqui para quebrar o ciclo de dependência
      const { Usuario, Role } = require('../models');

      // Busca o usuário no banco de dados para garantir que a role está atualizada.
      const user = await Usuario.findByPk(req.session.user.id, {
        include: [{ model: Role, as: 'role' }]
      });

      if (!user || !user.role || !roles.includes(user.role.nome)) {
        req.flash('error_msg', 'Você não tem permissão para acessar este recurso.');
        // Redireciona para a página anterior ou para o dashboard.
        return res.status(403).redirect(req.header('Referer') || '/dashboard');
      }

      return next();
    } catch (error) {
      console.error('Erro ao verificar a role do usuário:', error);
      req.flash('error_msg', 'Ocorreu um erro ao verificar suas permissões.');
      return res.status(500).redirect('/dashboard');
    }
  };
};

module.exports = {
  ensureAuthenticated,
  checkRole
};
