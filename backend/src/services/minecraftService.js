const Rcon = require('node-rcon');
const CommandLog = require('../models/CommandLog');

async function runCommand(command) {
  return new Promise((resolve, reject) => {
    const rcon = new Rcon(process.env.RCON_HOST, process.env.RCON_PORT, process.env.RCON_PASSWORD, { tcp: true, challenge: false });
    rcon.on('auth', () => rcon.send(command));
    rcon.on('response', (str) => { rcon.disconnect(); resolve(str); });
    rcon.on('error', reject);
    rcon.connect();
  });
}

async function executeOrderCommands(order, retry = 0) {
  for (const item of order.items) {
    for (const cmd of item.commands) {
      const command = cmd.replace('{player}', order.playerName);
      try {
        const response = await runCommand(command);
        await CommandLog.create({ orderId: order._id, playerName: order.playerName, command, status: 'success', response, attempts: retry + 1 });
      } catch (error) {
        await CommandLog.create({ orderId: order._id, playerName: order.playerName, command, status: 'failed', response: error.message, attempts: retry + 1 });
        if (retry < 3) {
          setTimeout(() => executeOrderCommands(order, retry + 1), 10000);
        }
      }
    }
  }
}

module.exports = { executeOrderCommands };
