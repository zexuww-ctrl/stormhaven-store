const router = require('express').Router();
const { getRecentOrders, getMyOrders, getAllOrders } = require('../controllers/orderController');
const { auth, admin } = require('../middleware/auth');

router.get('/recent', getRecentOrders);
router.get('/me', auth, getMyOrders);
router.get('/', auth, admin, getAllOrders);

module.exports = router;
