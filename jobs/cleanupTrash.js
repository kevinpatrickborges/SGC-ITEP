const cron = require('node-cron');
const { Op } = require('sequelize');
const Desarquivamento = require('../models/Desarquivamento');

// Função para excluir registros da lixeira com mais de 30 dias
const cleanupTrash = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedCount = await Desarquivamento.destroy({
      where: {
        deletedAt: { [Op.ne]: null, [Op.lte]: thirtyDaysAgo }
      },
      force: true // Exclusão permanente
    });

    console.log(`[Job de Limpeza da Lixeira] ${deletedCount} registros excluídos permanentemente.`);
  } catch (error) {
    console.error('[Job de Limpeza da Lixeira] Erro ao limpar a lixeira:', error);
  }
};

// Agendar o job para rodar uma vez por dia à meia-noite
// (Você pode ajustar a frequência conforme a necessidade)
const startCleanupJob = () => {
  cron.schedule('0 0 * * *', () => {
    console.log('[Job de Limpeza da Lixeira] Executando job de limpeza...');
    cleanupTrash();
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo" // Ajuste para o seu fuso horário
  });
};

module.exports = startCleanupJob;
