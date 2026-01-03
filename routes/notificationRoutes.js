const express = require('express');
const {
    getNotifications,
    markAsRead,
    clearNotifications
} = require('../controllers/notificationController');
const { protect } = require('../controllers/authController');

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/read/:id', markAsRead);
router.delete('/clear', clearNotifications);

module.exports = router;
