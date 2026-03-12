const Order = require('../models/Order');

exports.getRecentOrders = async (req, res) => {
  const orders = await Order.find({ paymentStatus: 'paid' }).sort({ createdAt: -1 }).limit(8);
  res.json(orders.map((o) => ({ _id: o._id, playerName: o.playerName, productName: o.items[0]?.name, total: o.total })));
};

exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(orders);
};

exports.getAllOrders = async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
};
