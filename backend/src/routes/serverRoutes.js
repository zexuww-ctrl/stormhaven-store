const router = require('express').Router();
const { status, leaderboard } = require('../controllers/serverController');

router.get('/status', status);
router.get('/leaderboard', leaderboard);

module.exports = router;
