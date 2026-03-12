const User = require('../models/User');
const Order = require('../models/Order');
const DiscountCode = require('../models/DiscountCode');

exports.stats = async (req, res) => {
  const orders = await Order.find({ paymentStatus: 'paid' });
  const revenue = orders.reduce((acc, o) => acc + o.total, 0);
  res.json({
    revenue,
    orders: await Order.countDocuments(),
    users: await User.countDocuments()
  });
};

exports.getDiscountCodes = async (req, res) => res.json(await DiscountCode.find().sort({ createdAt: -1 }));
exports.createDiscountCode = async (req, res) => res.status(201).json(await DiscountCode.create(req.body));
exports.deleteDiscountCode = async (req, res) => {
  await DiscountCode.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};
