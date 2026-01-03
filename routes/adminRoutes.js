const express = require('express');
const {
    adminLogin,
    getAdminProfile,
    getDashboardStats
} = require('../controllers/adminController');
const {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

router.post('/login', adminLogin);
router.get('/me', protect, restrictTo('admin'), getAdminProfile);
router.get('/stats', protect, restrictTo('admin'), getDashboardStats);

// Product Management
router.route('/products')
    .get(protect, restrictTo('admin'), getAllProducts)
    .post(protect, restrictTo('admin'), createProduct);

router.route('/products/:id')
    .get(protect, restrictTo('admin'), getProduct)
    .put(protect, restrictTo('admin'), updateProduct)
    .delete(protect, restrictTo('admin'), deleteProduct);

module.exports = router;
