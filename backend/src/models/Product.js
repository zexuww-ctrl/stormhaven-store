const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  category: { type: String, enum: ['rank', 'crate', 'bundle'] },
  description: String,
  image: String,
  price: Number,
  perks: [String],
  commands: [String],
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
