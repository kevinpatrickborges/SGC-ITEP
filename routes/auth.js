const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


// Rotas legadas (views)
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);
router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);



module.exports = router;
