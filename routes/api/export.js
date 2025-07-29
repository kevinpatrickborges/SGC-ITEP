const express = require('express');
const router = express.Router();
const { ensureAuthenticated: auth } = require('../../middlewares/auth');
const roleRequired = require('../../middlewares/roleRequired');
const exportController = require('../../controllers/exportController');

// Rotas de exportação de vestígios removidas na simplificação

// Exportação de desarquivamentos
router.get('/desarquivamentos/excel', auth, roleRequired(['admin', 'NUGECID_EDITOR', 'auditor']), exportController.exportDesarquivamentosExcel);
router.get('/desarquivamentos/pdf', auth, roleRequired(['admin', 'NUGECID_EDITOR', 'auditor']), exportController.exportDesarquivamentosPDF);

module.exports = router;
