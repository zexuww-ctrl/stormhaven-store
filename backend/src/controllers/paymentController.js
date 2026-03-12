const axios = require('axios');
const { validationResult } = require('express-validator');
const DiscountCode = require('../models/DiscountCode');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { createStripeSession, stripe } = require('../services/paymentService');
const { executeOrderCommands } = require('../services/minecraftService');

exports.validateMojangUsername = async (req, res) => {
  const { username } = req.params;
  try {
    await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    res.json({ valid: true });
  } catch {
    res.json({ valid: false });
  }
};

exports.createSession = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { items, playerName, paymentMethod, discountCode } = req.body;
  const products = await Product.find({ _id: { $in: items.map((i) => i._id) } });

  const normalizedItems = items.map((cartItem) => {
    const dbItem = products.find((p) => String(p._id) === String(cartItem._id));
    return {
      productId: dbItem._id,
      name: dbItem.name,
      price: dbItem.price,
      quantity: cartItem.quantity,
      commands: dbItem.commands
    };
  });

  const subtotal = normalizedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  let discountAmount = 0;
  if (discountCode) {
    const code = await DiscountCode.findOne({ code: discountCode.toUpperCase(), active: true });
    if (code) discountAmount = subtotal * (code.percentage / 100);
  }

  const order = await Order.create({
    user: req.user?.id,
    playerName,
    items: normalizedItems,
    subtotal,
    discountCode,
    discountAmount,
    total: subtotal - discountAmount,
    paymentMethod
  });

  if (paymentMethod === 'stripe') {
    const session = await createStripeSession(order);
    return res.json({ provider: 'stripe', url: session.url, orderId: order._id });
  }

  return res.json({ provider: 'paypal', orderId: order._id, message: 'Create PayPal order on client or via dedicated endpoint.' });
};

exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const order = await Order.findById(session.metadata.orderId);
    if (order && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      await order.save();
      executeOrderCommands(order);
    }
  }

  res.json({ received: true });
};
