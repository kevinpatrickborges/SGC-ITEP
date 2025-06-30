const express = require('express');
const router = express.Router();
const { ensureAuthenticated: auth } = require('../../middlewares/auth');
const roleRequired = require('../../middlewares/roleRequired');
const exportController = require('../../controllers/exportController');

// Exportação de vestígios
router.get('/vestigios/excel', auth, roleRequired(['admin','tecnico','auditor']), exportController.exportVestigiosExcel);
router.get('/vestigios/pdf', auth, roleRequired(['admin','tecnico','auditor']), exportController.exportVestigiosPDF);

module.exports = router;
