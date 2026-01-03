const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const compression = require('compression');

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./middleware/errorMiddleware');

// Route files
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes'); // Import wishlist routes
const cartRoutes = require('./routes/cartRoutes'); // Import cart routes
const searchRoutes = require('./routes/searchRoutes'); // Import search routes
const notificationRoutes = require('./routes/notificationRoutes'); // Import notification routes
const userRoutes = require('./routes/userRoutes');
const usersRoutes = require('./routes/usersRoutes'); // Import admin users routes
const adminRoutes = require('./routes/adminRoutes'); // Import admin routes
const uploadRoutes = require('./routes/uploadRoutes'); // Import upload routes

const app = express();

// 1) GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors());
// Access-Control-Allow-Origin *
// app.options('*', cors());

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    // Production logging
    app.use(morgan('combined'));
}

// Limit requests from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Make uploads folder static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsQuantity',
            'ratingsAverage',
            'maxGroupSize',
            'difficulty',
            'price'
        ]
    })
);

app.use(compression());

// 2) ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes); // Mount wishlist routes
app.use('/api/cart', cartRoutes); // Mount cart routes
app.use('/api/search', searchRoutes); // Mount search routes
app.use('/api/notifications', notificationRoutes); // Mount notification routes
app.use('/api/profile', userRoutes); // Mount user profile routes
app.use('/api/users', usersRoutes); // Mount admin users routes
app.use('/api/admin', adminRoutes); // Mount admin routes
app.use('/api/upload', uploadRoutes); // Mount upload routes

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is healthy',
        timestamp: new Date().toISOString()
    });
});

app.get('/healthz', (req, res) => {
    res.status(200).send('OK');
});

// Handle undefined routes
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
