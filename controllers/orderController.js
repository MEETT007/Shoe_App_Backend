const Order = require('../models/Order');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// @desc    Create new order (Checkout)
// @route   POST /api/orders/checkout
// @access  Private
exports.createOrder = catchAsync(async (req, res, next) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice, // subtotal equivalent
        taxPrice,
        shippingPrice,
        totalPrice
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        return next(new AppError('No order items', 400));
    }

    const order = new Order({
        orderItems,
        user: req.user._id,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        status: 'pending' // Default
    });

    const createdOrder = await order.save();

    res.status(201).json({
        status: 'success',
        data: {
            order: createdOrder
        }
    });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = catchAsync(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
        return next(new AppError('No order found with that ID', 404));
    }

    // Ensure user can only see their own order unless admin
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return next(new AppError('Not authorized to view this order', 403));
    }

    res.status(200).json({
        status: 'success',
        data: {
            order
        }
    });
});

// @desc    Get logged in user orders
// @route   GET /api/orders/my
// @access  Private
exports.getMyOrders = catchAsync(async (req, res, next) => {
    const orders = await Order.find({ user: req.user._id });

    res.status(200).json({
        status: 'success',
        results: orders.length,
        data: {
            orders
        }
    });
});

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = catchAsync(async (req, res, next) => {
    const orders = await Order.find().populate('user', 'id name');

    res.status(200).json({
        status: 'success',
        results: orders.length,
        data: {
            orders
        }
    });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new AppError('Order not found', 404));
    }

    order.status = status;
    const updatedOrder = await order.save();

    res.status(200).json({
        status: 'success',
        data: {
            order: updatedOrder
        }
    });
});
