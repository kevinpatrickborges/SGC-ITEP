'use strict';

const { Publicacao } = require('../models');
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

// Compila todos os dados para o dashboard de estatísticas.
exports.getDashboardStats = async () => {
  try {
    const [publicacoesPorTipo] = await Promise.all([
      getPublicacoesPorTipo()
    ]);

    return {
      publicacoesPorTipo
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    throw new Error('Não foi possível gerar as estatísticas.');
  }
};
