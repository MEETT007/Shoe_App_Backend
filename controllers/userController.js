const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
exports.getUserProfile = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                createdAt: user.createdAt
            }
        }
    });
});

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
exports.updateUserProfile = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    // If email is being changed, we might want to verify it's not taken by another user (except self)
    // But Mongo unique index handles that and throws error which our handler catches.

    // Explicitly exclude password updates here to avoid accidental hashing if passed empty or similar issues, 
    // although mongoose schema logic usually handles it. Passwords should use the specific endpoint.

    const updatedUser = await user.save();

    res.status(200).json({
        status: 'success',
        data: {
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                isAdmin: updatedUser.isAdmin,
                token: generateToken(updatedUser._id) // Optional: Send new token if critical info changed? Not really needed for name/email usually unless claims change.
                // Keeping it simple.
            }
        }
    });
});

// @desc    Update password
// @route   PUT /api/profile/password
// @access  Private
exports.updatePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    // 1) Get user from collection
    // We need password explicitly because it's not selected by default usually? 
    // Wait, in User.js we didn't set select: false for password, but typically we do.
    // Let's check User.js... It has `password: { type: String, required: true }`. No select: false.
    // But `findOne` logic might vary. Using `findById` usually returns it.
    // ACTUALLY, good practice is `select: false` but let's assume it's available or we specifically select it if hidden.
    // Let's safety check:

    const user = await User.findById(req.user._id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.matchPassword(currentPassword))) {
        return next(new AppError('Your current password is wrong', 401));
    }

    // 3) Update password
    user.password = newPassword;
    await user.save(); // User.pre('save') handles hashing

    // 4) Log user in, send JWT
    // (Should we send a new token? Usually yes, to extend session or similar, but client already has one).
    // Let's return success message.

    // We need to generate token function available here? It's in authController locally.
    // Let's just return success for now. Client can keep using old token until expiry or we export signToken.
    // Ideally, changing password invalidates old tokens (via `changedPasswordAfter`).
    // So we MUST send a new token.

    // We need to import signToken logic or duplicate it.
    // Let's duplicate strictly the token creation part for now or refactor to utils.
    // For expediency, I'll assume client re-logins or I provide token.
    // Wait, AuthController logic:
    /*
    const signToken = id => {
        return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    };
    */

    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });

    res.status(200).json({
        status: 'success',
        token,
        message: 'Password updated successfully'
    });
});

// @desc    Delete user account (Soft delete)
// @route   DELETE /api/profile
// @access  Private
exports.deleteUserAccount = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    user.isDeleted = true;
    user.deletedAt = new Date(); // If we add this field to User model (we added it to Product, User usually has isDeleted).
    // Let's check User model for deletedAt. We added `isDeleted` and `passwordChangedAt`.
    // I should probably add `deletedAt` to User model if I want to be consistent with Product, 
    // but the requirement just says "Delete account (soft)". `isDeleted: true` is sufficient base soft delete.

    await user.save({ validateBeforeSave: false }); // Disable validation to avoid other checks failing if any

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    });
});

// @desc    Delete user (Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // Soft delete
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save({ validateBeforeSave: false });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

function generateToken(id) {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
}
