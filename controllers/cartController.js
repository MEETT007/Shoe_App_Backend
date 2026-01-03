const Cart = require('../models/Cart');
const Product = require('../models/Product');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = catchAsync(async (req, res, next) => {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
        path: 'items.product',
        select: 'name image slug brand isDeleted deletedAt'
    });

    if (!cart) {
        // Return empty structure if not found
        return res.status(200).json({
            status: 'success',
            results: 0,
            data: {
                cart: { items: [], subtotal: 0 }
            }
        });
    }

    // Filter populated products that might be null or deleted
    // Note: Population returns null if referenced doc is missing.
    // If 'deletedAt' is used, we might want to flag them or remove them.
    // Ideally, we signal the user that an item is no longer available.
    // For now, let's filter out nulls.

    // Check if any product is null (deleted physically) or soft deleted (if we check .deletedAt)
    // The previous population query didn't strictly filter 'deletedAt' but we requested it.

    // Filter logic
    cart.items = cart.items.filter(item => {
        return item.product && !item.product.deletedAt;
    });

    // Re-save to update subtotal if items were removed?
    // Doing so implicitly might be good, or just display valid items.
    // Let's rely on save logic which recalcs subtotal, so if we removed items, saving keeps strict consistency.
    // However, saving on GET is essentially a side-effect.
    // Instead we just return the calculated view.

    const viewItems = cart.items;
    const viewSubtotal = viewItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Create a temporary view object (don't save if not necessary to avoid write overhead on every GET)
    // But if items were filtered, maybe we should save? 
    // Let's keep it simple: just return valid items.

    res.status(200).json({
        status: 'success',
        results: viewItems.length,
        data: {
            cart: {
                _id: cart._id,
                items: viewItems,
                subtotal: viewSubtotal
            }
        }
    });
});

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
exports.addToCart = catchAsync(async (req, res, next) => {
    const { productId, size, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
        return next(new AppError('Product not found', 404));
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        cart = new Cart({
            user: req.user._id,
            items: []
        });
    }

    // Check if item exists (same product AND size)
    const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === productId && item.size === Number(size)
    );

    if (existingItemIndex > -1) {
        // Update quantity
        cart.items[existingItemIndex].quantity += Number(quantity);
        // Optionally update price to current price? Requirement says "priceSnapshot". 
        // If "priceSnapshot" means capture price at first add, then we keep it. 
        // If it means "current price", we update it.
        // Usually, mixing old price with new quantity is weird. 
        // Let's update price to current product price for the whole batch or similar.
        // Requirement gives no strict rule, but "priceSnapshot" usually means "Price At specific time".
        // Use case: Adding more means re-evaluating the deal? 
        // Let's stick to: Update price to current product price to be safe/fair.
        cart.items[existingItemIndex].price = product.discountPrice || product.price;
    } else {
        // Add new item
        const price = product.discountPrice || product.price;
        cart.items.push({
            product: productId,
            size: Number(size),
            quantity: Number(quantity),
            price: price
        });
    }

    await cart.save(); // Triggers subtotal recalc

    res.status(200).json({
        status: 'success',
        message: 'Item added to cart',
        data: {
            cart
        }
    });
});

// @desc    Update item quantity
// @route   PUT /api/cart/update
// @access  Private
exports.updateCartItem = catchAsync(async (req, res, next) => {
    const { itemId, quantity } = req.body;
    // Usually easier to identify by itemId (array subdocument ID) or (productId + size).
    // Let's assume body provides itemId (cart item _id).

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        return next(new AppError('Cart not found', 404));
    }

    const item = cart.items.id(itemId);
    if (!item) {
        return next(new AppError('Item not found in cart', 404));
    }

    item.quantity = Number(quantity);

    if (item.quantity <= 0) {
        item.remove();
    }

    await cart.save();

    res.status(200).json({
        status: 'success',
        data: {
            cart
        }
    });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:itemId
// @access  Private
exports.removeFromCart = catchAsync(async (req, res, next) => {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        return next(new AppError('Cart not found', 404));
    }

    // Mongoose array pull
    // cart.items.pull({ _id: itemId }); // Works if itemId is the subdoc ID
    // OR filter

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);

    if (cart.items.length === initialLength) {
        return next(new AppError('Item not found in cart', 404));
    }

    await cart.save();

    res.status(200).json({
        status: 'success',
        data: {
            cart
        }
    });
});
