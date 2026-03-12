const router = require('express').Router();
const { stats, getDiscountCodes, createDiscountCode, deleteDiscountCode } = require('../controllers/adminController');
const { auth, admin } = require('../middleware/auth');

router.get('/stats', auth, admin, stats);
router.get('/discount-codes', auth, admin, getDiscountCodes);
router.post('/discount-codes', auth, admin, createDiscountCode);
router.delete('/discount-codes/:id', auth, admin, deleteDiscountCode);

module.exports = router;
