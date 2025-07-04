const express = require('express');
const router = express.Router();
// const auth = require('../../middlewares/auth');
// const roleRequired = require('../../middlewares/roleRequired');
const dashboardService = require('../../services/dashboardService');

// API para obter estatísticas do dashboard
router.get('/stats', /* auth, roleRequired(['admin', 'tecnico', 'auditor']),*/ async (req, res) => {
    try {
        const stats = await dashboardService.getDashboardStats();
        res.json(stats);
    } catch (error) {
        console.error('Erro ao obter estatísticas do dashboard:', error);
        res.status(500).json({ error: 'Erro ao obter estatísticas' });
    }
});

module.exports = router;
