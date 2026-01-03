const express = require('express');
const {
    getUserProfile,
    updateUserProfile,
    updatePassword,
    deleteUserAccount
} = require('../controllers/userController');
const { protect } = require('../controllers/authController');

const router = express.Router();

router.use(protect); // All routes protected

router
    .route('/')
    .get(getUserProfile)
    .put(updateUserProfile)
    .delete(deleteUserAccount);

router.put('/password', updatePassword); // Add password update route

module.exports = router;
