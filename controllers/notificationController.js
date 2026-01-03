const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = catchAsync(async (req, res, next) => {
    const notifications = await Notification.find({ user: req.user._id }).sort('-createdAt');

    res.status(200).json({
        status: 'success',
        results: notifications.length,
        data: {
            notifications
        }
    });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/read/:id
// @access  Private
exports.markAsRead = catchAsync(async (req, res, next) => {
    const notification = await Notification.findOne({
        _id: req.params.id,
        user: req.user._id
    });

    if (!notification) {
        return next(new AppError('Notification not found', 404));
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
        status: 'success',
        data: {
            notification
        }
    });
});

// @desc    Clear all notifications
// @route   DELETE /api/notifications/clear
// @access  Private
exports.clearNotifications = catchAsync(async (req, res, next) => {
    await Notification.deleteMany({ user: req.user._id });

    res.status(204).json({
        status: 'success',
        data: null
    });
});
