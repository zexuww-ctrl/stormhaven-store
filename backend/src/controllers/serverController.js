const axios = require('axios');

exports.status = async (req, res) => {
  try {
    const { data } = await axios.get(`https://api.mcsrvstat.us/2/${process.env.MC_SERVER_IP || 'mc.stormhaven.fun'}`);
    res.json({ online: data.online, players: data.players?.online || 0, max: data.players?.max || 0 });
  } catch {
    res.json({ online: false, players: 0, max: 0 });
  }
};

exports.leaderboard = async (req, res) => {
  res.json([
    { player: 'Zephyr', value: 1200 },
    { player: 'Aria', value: 1060 },
    { player: 'Nova', value: 980 }
  ]);
};
