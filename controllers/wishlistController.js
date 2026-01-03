const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = catchAsync(async (req, res, next) => {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
        path: 'products',
        select: 'name price discountPrice slug images isDeleted deletedAt'
    });

    if (!wishlist) {
        // If no wishlist exists, return empty list
        return res.status(200).json({
            status: 'success',
            results: 0,
            data: {
                products: []
            }
        });
    }

    // Filter out deleted products dynamically if population includes them (soft delete check)
    // The population query logic generally includes all IDs, but we should make sure we only send valid products.
    // Since population runs query, we can try to filter there? 
    // Mongoose population doesn't easily support connection-level query middleware filtering for populate without explicit match options.
    // However, our Product query middleware filters `deletedAt: null`. 
    // So populated products that are deleted might return null in the array or be excluded depending on Mongoose version behavior with query middleware.
    // Standard behavior: if middleware filters it, populate returns null.

    // Clean nulls from products array (in case of soft deletes)
    const validProducts = wishlist.products.filter(product => product !== null);

    res.status(200).json({
        status: 'success',
        results: validProducts.length,
        data: {
            products: validProducts
        }
    });
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
exports.addToWishlist = catchAsync(async (req, res, next) => {
    const { productId } = req.params;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
        return next(new AppError('Product not found', 404));
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
        wishlist = await Wishlist.create({
            user: req.user._id,
            products: [productId]
        });
    } else {
        // Check if product already in wishlist
        // Using .toString() for ObjectId comparison
        if (!wishlist.products.some(p => p.toString() === productId)) {
            wishlist.products.push(productId);
            await wishlist.save();
        } else {
            return next(new AppError('Product already in wishlist', 400));
        }
    }

    res.status(200).json({
        status: 'success',
        message: 'Product added to wishlist'
    });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
exports.removeFromWishlist = catchAsync(async (req, res, next) => {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
        return next(new AppError('Wishlist not found', 404));
    }

    // Check if product is in wishlist
    if (!wishlist.products.some(p => p.toString() === productId)) {
        return next(new AppError('Product not in wishlist', 404));
    }

    // Remove product
    wishlist.products = wishlist.products.filter(p => p.toString() !== productId);
    await wishlist.save();

    res.status(200).json({
        status: 'success',
        message: 'Product removed from wishlist'
    });
});
