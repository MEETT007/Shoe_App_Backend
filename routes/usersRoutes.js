const express = require('express');
const {
    getAllUsers,
    deleteUser
} = require('../controllers/userController');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(restrictTo('admin'));

router
    .route('/')
    .get(getAllUsers);

router
    .route('/:id')
    .delete(deleteUser);

module.exports = router;
