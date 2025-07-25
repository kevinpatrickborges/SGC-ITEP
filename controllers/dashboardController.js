// Controlador do dashboard
// Mostra usuários ativos por IP e estatísticas de vestígios
const sessionStore = require('express-session').Store;
const { Desarquivamento } = require('../models');
const { Op } = require('sequelize');
const statisticsService = require('../services/statisticsService');

// Função para obter usuários ativos por IP com heartbeat
const ONE_MINUTE = 60 * 1000;
let getActiveUsersByIP = (sessionStoreInstance) => {
  return new Promise((resolve, reject) => {
    if (!sessionStoreInstance.all) return resolve({});
    sessionStoreInstance.all((err, sessions) => {
      if (err) return reject(err);
      let ipMap = {};
      const now = Date.now();
      Object.values(sessions).forEach(sess => {
        if (sess.user && sess.ip && sess.lastPing && (now - sess.lastPing < ONE_MINUTE)) {
          if (!ipMap[sess.ip]) {
            ipMap[sess.ip] = {
              count: 0,
              users: []
            };
          }
          ipMap[sess.ip].count++;
          // Evitar duplicatas de usuários
          if (!ipMap[sess.ip].users.find(u => u.id === sess.user.id)) {
            ipMap[sess.ip].users.push({
              id: sess.user.id,
              nome: sess.user.nome || sess.user.email || 'Usuário'
            });
          }
        }
      });
      resolve(ipMap);
    });
  });
};

// Renderiza a página principal do dashboard
const renderDashboard = async (req, res) => {
  try {
    // Obter contagens básicas para os cards usando o modelo Desarquivamento
    const totalDesarquivamentos = await Desarquivamento.count();
    const desarquivamentosEmPosse = await Desarquivamento.count({
      where: {
        status: {
          [Op.in]: ['Em posse', 'Retirado pelo setor', 'Desarquivado']
        }
      }
    });
    const solicitacoesRecentes = await Desarquivamento.count({
      where: {
        createdAt: { // Usando createdAt como data da solicitação
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) // últimos 30 dias
        }
      }
    });
    
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const today = new Date();

    const vestigiosUrgentes = await Desarquivamento.count({
      where: {
        [Op.or]: [
          { status: 'Retirado pelo setor', dataPrazoDevolucao: { [Op.lt]: today } },
          { status: { [Op.in]: ['Desarquivado', 'Não coletado'] }, updatedAt: { [Op.lt]: fiveDaysAgo } },
          { status: 'Solicitado', dataSolicitacao: { [Op.lt]: fiveDaysAgo } },
          { status: 'Rearquivamento solicitado', updatedAt: { [Op.lt]: fiveDaysAgo } },
          { status: 'Não localizado', updatedAt: { [Op.lt]: fiveDaysAgo } }
        ]
      }
    });
    
    // Obter registros recentes para a tabela
    const registrosRecentes = await Desarquivamento.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'nomeCompleto', 'tipoDocumento', 'numDocumento', 'status', 'createdAt'] 
    });
    
    // Buscar usuários ativos por IP (se possível)
    let usersByIp = {};
    if (req.sessionStore) {
      try {
        usersByIp = await getActiveUsersByIP(req.sessionStore);
      } catch (e) {
        usersByIp = {};
      }
    }
    res.render('dashboard/index', {
      title: 'Dashboard',
      totalDesarquivamentos,
      desarquivamentosEmPosse,
      usersByIp,
      solicitacoesRecentes,
      vestigiosUrgentes,
      registrosRecentes,
      currentUser: req.session.user
    });
  } catch (error) {
    console.error('Erro ao renderizar dashboard:', error);
    res.status(500).render('error', { message: 'Erro ao carregar dashboard' });
  }
};

// API para obter estatísticas para os gráficos
const getDashboardStats = async (req, res) => {
  try {
    const stats = await statisticsService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Erro ao obter estatísticas do dashboard:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
};

// Renderiza a página de estatísticas avançadas
const renderStatistics = async (req, res) => {
  try {
    const stats = await statisticsService.getDashboardStats();
    res.render('dashboard/estatisticas', {
      title: 'Estatísticas do Sistema',
      layout: 'layout',
      stats: stats
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Não foi possível carregar a página de estatísticas.');
    res.redirect('/dashboard');
  }
};

module.exports = { 
  getActiveUsersByIP,
  renderDashboard,
  getDashboardStats,
  renderStatistics
};
