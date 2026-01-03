const Product = require('../models/Product');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

// @desc    Search products
// @route   GET /api/search
// @access  Public
exports.searchProducts = catchAsync(async (req, res, next) => {
    // Reusing the robust APIFeatures which now handles 'keyword'
    // This allows: /api/search?keyword=nike&price[lte]=100&sort=price

    // We can also default to some logic if no keyword.

    // The requirement says:
    // Support: keyword search, gender, size, price range, best seller, new arrival, sorting

    // apiFeatures handles:
    // - keyword (via our update)
    // - price range (gte/lte logic in filter())
    // - sorting (sort())
    // - gender, bestSeller, newArrival, etc. (via basic filter() match if passed in query)

    // Size is an array in DB. Querying `?size=42` works in Mongo if array contains 42.
    // So generic apiFeatures handles that too automatically.

    const features = new APIFeatures(Product.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const products = await features.query;

    res.status(200).json({
        status: 'success',
        results: products.length,
        data: {
            products
        }
    });
});
