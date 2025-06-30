const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');

// RESTful API endpoints para autenticação
router.post('/login', authController.apiLogin); // POST: { email, senha }
router.post('/refresh', authController.apiRefreshToken); // POST: { refreshToken }
router.post('/logout', authController.apiLogout); // POST: { refreshToken }

module.exports = router;
