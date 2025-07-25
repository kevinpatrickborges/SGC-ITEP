const express = require('express');
const router = express.Router();
const projetosController = require('../controllers/projetosController');
const tarefasController = require('../controllers/tarefasController');
const { ensureAuthenticated, ensureRole } = require('../middlewares/auth');

// Middleware para todas as rotas
router.use(ensureAuthenticated);

// Rotas de Projetos
router.get('/', projetosController.index);
router.get('/create', projetosController.create);
router.post('/', projetosController.store);
router.get('/:id', projetosController.show);
router.get('/:id/edit', projetosController.edit);
router.put('/:id', projetosController.update);
router.delete('/:id', projetosController.destroy);

// Rotas de Membros de Projetos
router.delete('/:id/membros/:membroId', projetosController.removeMembro);

// Rotas de Tarefas (API)
router.get('/:projetoId/tarefas', tarefasController.index);
router.post('/:projetoId/tarefas', tarefasController.store);
router.get('/tarefas/:id', tarefasController.show);
router.put('/tarefas/:id', tarefasController.update);
router.patch('/tarefas/:id/move', tarefasController.move);
router.delete('/tarefas/:id', tarefasController.destroy);

module.exports = router;