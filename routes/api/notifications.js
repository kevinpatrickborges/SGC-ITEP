const express = require('express');
const router = express.Router();
const notificationsController = require('../../controllers/notificationsController');
const { ensureAuthenticated } = require('../../middlewares/auth');

// @route   GET api/notifications
// @desc    Obter notificações pendentes
// @access  Private
router.get('/', ensureAuthenticated, notificationsController.getPendingNotifications);

module.exports = router; 