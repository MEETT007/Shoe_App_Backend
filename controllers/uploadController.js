const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// @desc    Upload single image
// @route   POST /api/upload
// @access  Private
exports.uploadImage = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('No file uploaded', 400));
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.status(200).json({
        status: 'success',
        image: fileUrl,
        filename: req.file.filename
    });
});

// @desc    Upload multiple images
// @route   POST /api/upload/multiple
// @access  Private
exports.uploadMultipleImages = catchAsync(async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next(new AppError('No files uploaded', 400));
    }

    const images = req.files.map(file => ({
        url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
        filename: file.filename
    }));

    res.status(200).json({
        status: 'success',
        images
    });
});
