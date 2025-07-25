'use strict';

const Desarquivamento = require('../models/Desarquivamento');
const { Op, Sequelize } = require('sequelize');

// Retorna dados consolidados para os gráficos do dashboard principal.
exports.getDashboardStats = async () => {
  try {
    const totalDesarquivamentos = await Desarquivamento.count();
    const desarquivamentosEmPosse = await Desarquivamento.count({
      where: {
        status: {
          [Op.in]: ['Em posse', 'Retirado pelo setor', 'Desarquivado']
        }
      }
    });
    const solicitacoesRecentes = await Desarquivamento.count({
      where: { createdAt: { [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) } }
    });

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const today = new Date();

    const vestigiosUrgentes = await Desarquivamento.count({
      where: {
        [Op.or]: [
          // 1. Retirado pelo setor com prazo vencido
          {
            status: 'Retirado pelo setor',
            dataPrazoDevolucao: { [Op.lt]: today }
          },
          // 2. Desarquivado ou Não coletado há mais de 5 dias
          {
            status: { [Op.in]: ['Desarquivado', 'Não coletado'] },
            updatedAt: { [Op.lt]: fiveDaysAgo }
          },
          // 3. Solicitado há mais de 5 dias
          {
            status: 'Solicitado',
            dataSolicitacao: { [Op.lt]: fiveDaysAgo }
          },
          // 4. Rearquivamento solicitado há mais de 5 dias
          {
            status: 'Rearquivamento solicitado',
            updatedAt: { [Op.lt]: fiveDaysAgo }
          },
          // 5. Não localizado há mais de 5 dias
          {
            status: 'Não localizado',
            updatedAt: { [Op.lt]: fiveDaysAgo }
          }
        ]
      }
    });

    const distribuicaoPorTipo = await Desarquivamento.findAll({
      attributes: ['tipoDesarquivamento', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['tipoDesarquivamento'], raw: true
    });

    const distribuicaoPorStatus = await Desarquivamento.findAll({
      attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['status'], raw: true
    });

    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
      return { 
        data: new Date(d.getFullYear(), d.getMonth(), 1), 
        mes: monthName.charAt(0).toUpperCase() + monthName.slice(1) 
      };
    }).reverse();

    const solicitacoesMensais = await Promise.all(meses.map(async (item) => {
      const count = await Desarquivamento.count({
        where: { createdAt: { 
          [Op.gte]: item.data, 
          [Op.lt]: new Date(item.data.getFullYear(), item.data.getMonth() + 1, 1) 
        }}
      });
      return { mes: item.mes, count };
    }));

    const distribuicaoPorTipoDocumento = await Desarquivamento.findAll({
      attributes: ['tipoDocumento', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['tipoDocumento'], order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']], limit: 5, raw: true
    });

    return {
      totalDesarquivamentos,
      desarquivamentosEmPosse,
      solicitacoesRecentes,
      vestigiosUrgentes,
      distribuicaoPorTipo,
      desarquivamentosPorStatus: distribuicaoPorStatus.map(item => ({
        status: item.status,
        total: parseInt(item.count)
      })),
      solicitacoesMensais,
      distribuicaoPorTipoDocumento
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas do dashboard:', error);
    throw new Error('Não foi possível gerar as estatísticas do dashboard.');
  }
};