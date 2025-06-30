const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const roleRequired = require('../../middlewares/roleRequired');
const { getDashboardStats } = require('../../controllers/dashboardController');

// API para obter estatísticas do dashboard
router.get('/stats', auth, roleRequired(['admin', 'tecnico', 'auditor']), getDashboardStats);

module.exports = router;
