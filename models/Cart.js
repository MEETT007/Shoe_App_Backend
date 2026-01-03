const mongoose = require('mongoose');

const cartSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        unique: true
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Product'
            },
            size: {
                type: Number,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
                min: 1
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],
    subtotal: {
        type: Number,
        required: true,
        default: 0
    }
}, {
    timestamps: true
});

// Calculate subtotal before saving
cartSchema.pre('save', function (next) {
    this.subtotal = this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
