const express = require('express');
const router = express.Router();

const vestigiosApiRoutes = require('./vestigios');
const localizacoesApiRoutes = require('./localizacoes');

router.use('/vestigios', vestigiosApiRoutes);
router.use('/localizacoes', localizacoesApiRoutes);

module.exports = router;
