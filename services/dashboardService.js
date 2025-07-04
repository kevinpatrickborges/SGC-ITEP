'use strict';

const Desarquivamento = require('../models/Desarquivamento');
const { Op, Sequelize } = require('sequelize');

// Retorna dados consolidados para os gráficos do dashboard principal.
exports.getDashboardStats = async () => {
  try {
    const totalDesarquivamentos = await Desarquivamento.count();
    const desarquivamentosEmPosse = await Desarquivamento.count({ where: { status: 'Em posse' } });
    const solicitacoesRecentes = await Desarquivamento.count({
      where: { dataSolicitacao: { [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) } }
    });
    const vestigiosUrgentes = 0;

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
        where: { dataSolicitacao: { 
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
      distribuicaoPorStatus,
      solicitacoesMensais,
      distribuicaoPorTipoDocumento
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas do dashboard:', error);
    throw new Error('Não foi possível gerar as estatísticas do dashboard.');
  }
}; 