'use strict';

const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const upload = require('../config/multerConfig');
const { ensureAuthenticated } = require('../middlewares/auth');

// Endpoint para upload de um único arquivo
// O nome 'file' no middleware deve corresponder ao nome do campo no formulário HTML
router.post('/upload', ensureAuthenticated, upload.single('file'), fileController.uploadFile);

// Futuramente, podemos adicionar rotas para download, deleção, etc.
// router.get('/download/:id', ensureAuthenticated, fileController.downloadFile);

module.exports = router;
