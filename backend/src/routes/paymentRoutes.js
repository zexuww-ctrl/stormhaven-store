const router = require('express').Router();
const { body } = require('express-validator');
const { createSession, stripeWebhook, validateMojangUsername } = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

router.post('/create-session', [body('playerName').isLength({ min: 3, max: 16 }), body('items').isArray({ min: 1 })], createSession);
router.post('/create-session-auth', auth, [body('playerName').isLength({ min: 3, max: 16 }), body('items').isArray({ min: 1 })], createSession);
router.post('/webhook/stripe', stripeWebhook);
router.get('/validate-username/:username', validateMojangUsername);

module.exports = router;
