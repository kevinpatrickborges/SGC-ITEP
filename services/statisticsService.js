'use strict';

const { Vestigio, Movimentacao, Publicacao } = require('../models/associations');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// Retorna a contagem de vestígios agrupados por tipo.
async function getVestigiosPorTipo() {
  return Vestigio.findAll({
    attributes: ['tipo', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
    group: ['tipo'],
    raw: true
  });
}

// Retorna a contagem de vestígios agrupados por status.
async function getVestigiosPorStatus() {
  return Vestigio.findAll({
    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
    group: ['status'],
    raw: true
  });
}

// Retorna a contagem de movimentações nos últimos 12 meses.
async function getMovimentacoesMensais() {
  const dozeMesesAtras = new Date();
  dozeMesesAtras.setMonth(dozeMesesAtras.getMonth() - 12);

  return Movimentacao.findAll({
    attributes: [
      [sequelize.fn('YEAR', sequelize.col('data')), 'ano'],
      [sequelize.fn('MONTH', sequelize.col('data')), 'mes'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'total']
    ],
    where: {
      data: {
        [Op.gte]: dozeMesesAtras
      }
    },
    group: ['ano', 'mes'],
    order: [['ano', 'ASC'], ['mes', 'ASC']],
    raw: true
  });
}

// Retorna a contagem de publicações por tipo.
async function getPublicacoesPorTipo() {
    return Publicacao.findAll({
      attributes: ['tipo', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
      group: ['tipo'],
      raw: true
    });
  }

// Compila todos os dados para o dashboard de estatísticas.
exports.getStatistics = async () => {
  try {
    const [vestigiosPorTipo, vestigiosPorStatus, movimentacoesMensais, publicacoesPorTipo] = await Promise.all([
      getVestigiosPorTipo(),
      getVestigiosPorStatus(),
      getMovimentacoesMensais(),
      getPublicacoesPorTipo()
    ]);

    return {
      vestigiosPorTipo,
      vestigiosPorStatus,
      movimentacoesMensais,
      publicacoesPorTipo
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    throw new Error('Não foi possível gerar as estatísticas.');
  }
};
