const express = require('express');
const {
    createOrder,
    getOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus
} = require('../controllers/orderController');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

router.use(protect);

// Mapping "checkout" to createOrder
router.post('/checkout', createOrder); // POST /api/orders/checkout

router.get('/my', getMyOrders); // GET /api/orders/my

// Admin route to get all orders, placement matters to avoid conflict with /:id if not careful, 
// but usually static routes should come before dynamic /:id
router.get('/', restrictTo('admin'), getAllOrders);

// Admin update status
router.put('/:id/status', restrictTo('admin'), updateOrderStatus);

router.route('/:id').get(getOrder);

module.exports = router;
