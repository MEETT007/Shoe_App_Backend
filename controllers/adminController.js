const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const jwt = require('jsonwebtoken');

// ... (keep helper functions like signToken, createSendToken)

// ... (keep adminLogin)

// ... (keep getAdminProfile)

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = catchAsync(async (req, res, next) => {
    // 1. Basic Counts
    const usersCount = await User.countDocuments();
    const productsCount = await Product.countDocuments();
    const ordersCount = await Order.countDocuments();

    // 2. Total Revenue (Aggregate)
    const totalRevenue = await Order.aggregate([
        { $match: { isPaid: true } }, // Only paid orders count? Or all? Let's assume paid or all for now. Usually paid.
        // Actually, requirement just says Total Revenue. Let's assume paid.
        // Wait, Order model has isPaid. Default false.
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    // 3. Sales Chart (Last 30 Days Revenue)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesChart = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: thirtyDaysAgo },
                isPaid: true
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                totalSales: { $sum: "$totalPrice" }
            }
        },
        { $sort: { _id: 1 } } // Sort by date ascending
    ]);

    // 4. Best Selling Products
    const bestSellingProducts = await Order.aggregate([
        { $unwind: "$orderItems" },
        {
            $group: {
                _id: "$orderItems.product",
                name: { $first: "$orderItems.name" },
                totalSold: { $sum: "$orderItems.qty" },
                revenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.qty"] } }
            }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 }
    ]);

    // 5. Recent Orders
    constrecentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email');

    res.status(200).json({
        status: 'success',
        data: {
            counts: {
                users: usersCount,
                products: productsCount,
                orders: ordersCount,
                revenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
            },
            salesChart,
            bestSellers: bestSellingProducts,
            recentOrders: constrecentOrders
        }
    });
});

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
exports.adminLogin = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // 3) Check if user is admin
    if (user.role !== 'admin' && !user.isAdmin) {
        return next(new AppError('Not authorized as admin', 403));
    }

    // 4) If everything ok, send token to client
    createSendToken(user, 200, res);
});

// @desc    Get current admin profile
// @route   GET /api/admin/me
// @access  Private/Admin
exports.getAdminProfile = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});
