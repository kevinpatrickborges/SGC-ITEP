const Auditoria = require('../models/Auditoria');

module.exports = async function logAuditoria(usuarioId, acao, entidade, entidadeId, detalhes) {
  try {
    await Auditoria.create({
      usuarioId,
      acao,
      entidade,
      entidadeId,
      detalhes
    });
  } catch (err) {
    // Log para debug, mas não interrompe o fluxo principal
    console.error('Erro ao registrar log de auditoria:', err);
  }
};
