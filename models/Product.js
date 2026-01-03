const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    brand: {
        type: String
    },
    category: {
        type: String
    },
    description: {
        type: String
    },
    price: {
        type: Number
    },
    discountPrice: {
        type: Number
    },
    images: {
        type: [String]
    },
    sizes: {
        type: [Number]
    },
    colors: {
        type: [String]
    },
    gender: {
        type: String,
        enum: ['men', 'women', 'unisex']
    },
    rating: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    isBestSeller: {
        type: Boolean
    },
    isNewArrival: {
        type: Boolean
    },
    isOnSale: {
        type: Boolean
    },
    isActive: {
        type: Boolean,
        default: true
    },
    deletedAt: {
        type: Date
    }
}, {
    timestamps: true
});

productSchema.index({ createdAt: -1 });

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
productSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// QUERY MIDDLEWARE
productSchema.pre(/^find/, function (next) {
    this.find({ deletedAt: null });
    next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
