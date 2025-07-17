'use strict';

const { Publicacao, Desarquivamento } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// Retorna a contagem de publicações por tipo.
async function getPublicacoesPorTipo() {
    return Publicacao.findAll({
      attributes: ['tipo', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
      group: ['tipo'],
      raw: true
    });
  }

async function getDesarquivamentosPorStatus() {
    return Desarquivamento.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
        group: ['status'],
        raw: true
    });
}

// Compila todos os dados para o dashboard de estatísticas.
exports.getDashboardStats = async () => {
  try {
    const [publicacoesPorTipo, desarquivamentosPorStatus] = await Promise.all([
      getPublicacoesPorTipo(),
      getDesarquivamentosPorStatus()
    ]);

    return {
      publicacoesPorTipo,
      desarquivamentosPorStatus
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    throw new Error('Não foi possível gerar as estatísticas.');
  }
};
