const Product = require('../models/Product');

exports.getProducts = async (req, res) => {
  const filter = req.query.category ? { category: req.query.category } : {};
  const products = await Product.find(filter);
  res.json(products);
};

exports.createProduct = async (req, res) => res.status(201).json(await Product.create(req.body));
exports.updateProduct = async (req, res) => res.json(await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }));
exports.deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};
