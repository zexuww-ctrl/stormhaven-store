const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  percentage: Number,
  expiresAt: Date,
  maxUses: Number,
  used: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('DiscountCode', discountSchema);
