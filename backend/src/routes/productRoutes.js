const router = require('express').Router();
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { auth, admin } = require('../middleware/auth');

router.get('/', getProducts);
router.post('/', auth, admin, createProduct);
router.put('/:id', auth, admin, updateProduct);
router.delete('/:id', auth, admin, deleteProduct);

module.exports = router;
