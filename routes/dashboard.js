const express = require('express');
const router = express.Router();

const { ensureAuthenticated: auth } = require('../middlewares/auth');
const roleRequired = require('../middlewares/roleRequired');

const { getActiveUsersByIP, renderDashboard, getDashboardStats, renderStatistics } = require('../controllers/dashboardController');

// Rota principal do dashboard
router.get('/', auth, async (req, res) => {
  try {
    // Obter usuários ativos
    let usersByIp = {};
    try {
      usersByIp = await getActiveUsersByIP(req.sessionStore);
    } catch (e) {
      console.error('Erro ao obter usuários ativos:', e);
    }
    
    // Renderizar o dashboard usando o controlador
    await renderDashboard(req, res);
  } catch (error) {
    console.error('Erro na rota do dashboard:', error);
    res.status(500).render('error', { message: 'Erro ao carregar dashboard' });
  }
});

// API para obter estatísticas para os gráficos
router.get('/stats', auth, roleRequired(['admin', 'tecnico', 'auditor']), getDashboardStats);

// Heartbeat: atualiza lastPing da sessão
router.post('/ping', auth, (req, res) => {
  req.session.lastPing = Date.now();
  res.sendStatus(204);
});

// Rota para a página de estatísticas avançadas
router.get('/estatisticas', auth, roleRequired(['admin', 'tecnico']), renderStatistics);

// Rota para o novo dashboard moderno
router.get('/moderno', auth, (req, res) => {
  res.render('dashboard-moderno', {
    title: 'Dashboard Moderno - SGC-ITEP',
    user: req.user,
    layout: false // Não usar layout padrão
  });
});

module.exports = router;
