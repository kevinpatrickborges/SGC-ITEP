const express = require('express');
const router = express.Router();

const vestigiosRoutes = require('./vestigios');
const localizacoesRoutes = require('./localizacoes');

router.use('/vestigios', vestigiosRoutes);
router.use('/localizacoes', localizacoesRoutes);

module.exports = router;
