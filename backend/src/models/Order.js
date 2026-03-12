const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  playerName: String,
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number,
    price: Number,
    commands: [String]
  }],
  subtotal: Number,
  discountCode: String,
  discountAmount: Number,
  total: Number,
  paymentMethod: { type: String, enum: ['stripe', 'paypal'] },
  paymentStatus: { type: String, default: 'pending' },
  commandStatus: { type: String, default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
