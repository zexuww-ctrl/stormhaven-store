const router = require('express').Router();
const { body } = require('express-validator');
const { register, login } = require('../controllers/authController');

router.post('/register', [body('email').isEmail(), body('password').isLength({ min: 6 })], register);
router.post('/login', login);

module.exports = router;
