const Order = require('../models/Order');
const { executeOrderCommands } = require('../services/minecraftService');

module.exports = async function retryFailedCommands() {
  const pending = await Order.find({ paymentStatus: 'paid', commandStatus: { $ne: 'done' } }).limit(20);
  for (const order of pending) {
    await executeOrderCommands(order);
  }
};
