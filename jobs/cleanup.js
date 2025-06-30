'use strict';

const cron = require('node-cron');
const { Op } = require('sequelize');
const { Vestigio, Usuario, Localizacao, Movimentacao, File, Publicacao } = require('../models/associations');
// O model Desarquivamento é específico do módulo e não está em associations, então mantemos a importação direta.
const Desarquivamento = require('../modules/nugecid/nugecid.model');

const modelsToClean = [Vestigio, Usuario, Localizacao, Movimentacao, File, Publicacao, Desarquivamento];

/**
 * Job para limpar itens arquivados (soft-deleted) há mais de 30 dias.
 * Roda todos os dias à 1h da manhã.
 */
const cleanupJob = cron.schedule('0 1 * * *', async () => {
  console.log('[CRON] Executando job de limpeza de itens arquivados...');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (const Model of modelsToClean) {
    try {
      const result = await Model.destroy({
        where: {
          deletedAt: {
            [Op.lt]: thirtyDaysAgo
          }
        },
        force: true // Exclusão permanente
      });

      if (result > 0) {
        console.log(`[CRON] ${result} registro(s) de ${Model.name} foram excluídos permanentemente.`);
      }
    } catch (error) {
      console.error(`[CRON] Erro ao limpar a tabela para ${Model.name}:`, error);
    }
  }

  console.log('[CRON] Job de limpeza finalizado.');
}, {
  scheduled: false, // Não inicia automaticamente
  timezone: "America/Sao_Paulo"
});

module.exports = {
  start: () => {
    console.log('Agendando job de limpeza de itens arquivados.');
    cleanupJob.start();
  }
};
