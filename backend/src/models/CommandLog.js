const mongoose = require('mongoose');

const commandLogSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  playerName: String,
  command: String,
  status: { type: String, enum: ['success', 'failed'] },
  response: String,
  attempts: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('CommandLog', commandLogSchema);
