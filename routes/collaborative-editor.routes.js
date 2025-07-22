'use strict';

const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const collaborativeEditorService = require('../services/collaborativeEditorService');

// Middleware para garantir autenticação em todas as rotas
router.use(ensureAuthenticated);

// Página principal do editor colaborativo
router.get('/', (req, res) => {
    res.render('collaborative-editor/index', {
        title: 'Editor Colaborativo',
        user: req.session.user,
        documentId: req.query.doc || 'default',
        layout: 'layout'
    });
});

// Página do editor para um documento específico
router.get('/document/:documentId', (req, res) => {
    const { documentId } = req.params;
    
    res.render('collaborative-editor/editor', {
        title: `Editor - Documento ${documentId}`,
        user: req.session.user,
        documentId: documentId,
        query: req.query,
        layout: 'layout'
    });
});

// API para obter estatísticas do editor
router.get('/api/stats', (req, res) => {
    try {
        const stats = collaborativeEditorService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// API para listar usuários online em um documento
router.get('/api/document/:documentId/users', (req, res) => {
    try {
        const { documentId } = req.params;
        const users = collaborativeEditorService.getOnlineUsers(documentId);
        
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Erro ao obter usuários online:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// API para criar um novo documento
router.post('/api/document', (req, res) => {
    try {
        const { title, content } = req.body;
        const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Aqui você pode salvar o documento no banco de dados
        // Por enquanto, apenas retornamos o ID gerado
        
        res.json({
            success: true,
            data: {
                documentId,
                title,
                content: content || { ops: [] }
            }
        });
    } catch (error) {
        console.error('Erro ao criar documento:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router;