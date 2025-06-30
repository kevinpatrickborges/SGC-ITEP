// Middleware para registrar logs de auditoria de ações sensíveis
const Usuario = require('../models/Usuario');

// Adiciona um log de auditoria ao usuário logado
async function registrarAuditoria(req, acao, detalhes) {
  if (!req.user) return;
  const usuario = await Usuario.findByPk(req.user.id);
  if (!usuario) return;
  const logs = usuario.logAuditoria || [];
  logs.push({
    acao,
    detalhes,
    data: new Date().toISOString(),
    ip: req.ip
  });
  // Mantém apenas os últimos 100 logs
  usuario.logAuditoria = logs.slice(-100);
  await usuario.save();
}

// Middleware para uso em rotas
function auditar(acao) {
  return async (req, res, next) => {
    await registrarAuditoria(req, acao, req.originalUrl);
    next();
  };
}

module.exports = { registrarAuditoria, auditar };
