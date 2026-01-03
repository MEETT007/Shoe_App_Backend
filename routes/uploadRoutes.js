const express = require('express');
const { uploadImage, uploadMultipleImages } = require('../controllers/uploadController');
const upload = require('../utils/upload');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

// Allow admin only or any authenticated user? Requirement says Admin UI so let's restrict or at least protect.
// For now, let's keep it protected.
router.post('/', protect, upload.single('image'), uploadImage);
router.post('/multiple', protect, upload.array('images', 5), uploadMultipleImages);

module.exports = router;
