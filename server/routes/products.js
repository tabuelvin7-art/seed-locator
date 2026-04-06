const express = require('express');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const Rating = require('../models/Rating');
const Search = require('../models/Search');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/products - search & list
router.get('/', async (req, res) => {
  const { q, category, type, page = 1, limit = 12, sort = 'newest' } = req.query;
  const filter = {};
  if (q) filter.$text = { $search: q };
  if (category) filter.category = category;
  if (type) filter.type = type;

  const sortMap = {
    newest:     { createdAt: -1 },
    oldest:     { createdAt: 1 },
    price_asc:  { price: 1 },
    price_desc: { price: -1 },
    rating:     { averageRating: -1 },
  };
  const sortOrder = sortMap[sort] || sortMap.newest;

  try {
    // Log search
    if (q && req.headers.authorization) {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
        await Search.create({ user: decoded.id, searchTerm: q, category });
      } catch { /* anonymous search */ }
    }

    const products = await Product.find(filter)
      .populate({ path: 'seller', populate: { path: 'user', select: 'username email phone' } })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort(sortOrder);

    const total = await Product.countDocuments(filter);
    res.json({ products, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/mine — seller's own products only
router.get('/mine', protect, requireRole('seller', 'admin'), async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) return res.json([]);
    const products = await Product.find({ seller: seller._id })
      .populate({ path: 'seller', populate: { path: 'user', select: 'username email phone' } })
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({ path: 'seller', populate: { path: 'user', select: 'username email phone' } });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const ratings = await Rating.find({ product: req.params.id }).populate('user', 'username');
    res.json({ product, ratings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products - seller only
router.post('/', protect, requireRole('seller', 'admin'), async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) return res.status(400).json({ message: 'Seller profile required' });
    const product = await Product.create({ ...req.body, seller: seller._id });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', protect, requireRole('seller', 'admin'), async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: seller?._id },
      req.body,
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found or unauthorized' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', protect, requireRole('seller', 'admin'), async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    const product = await Product.findOneAndDelete({ _id: req.params.id, seller: seller?._id });
    if (!product) return res.status(404).json({ message: 'Product not found or unauthorized' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products/:id/rate
router.post('/:id/rate', protect, requireRole('farmer'), async (req, res) => {
  const { ratingValue, reviewText } = req.body;
  try {
    // Only allow rating if buyer has a delivered order containing this product
    const Order = require('../models/Order');
    const deliveredOrder = await Order.findOne({
      buyer: req.user._id,
      status: 'delivered',
      'items.product': req.params.id,
    });
    if (!deliveredOrder) {
      return res.status(403).json({ message: 'You can only review products you have purchased and received.' });
    }

    const existing = await Rating.findOne({ user: req.user._id, product: req.params.id });
    if (existing) {
      existing.ratingValue = ratingValue;
      existing.reviewText = reviewText;
      await existing.save();
    } else {
      await Rating.create({ user: req.user._id, product: req.params.id, ratingValue, reviewText });
    }
    // Recalculate average
    const ratings = await Rating.find({ product: req.params.id });
    const avg = ratings.reduce((sum, r) => sum + r.ratingValue, 0) / ratings.length;
    await Product.findByIdAndUpdate(req.params.id, { averageRating: avg.toFixed(1), ratingCount: ratings.length });
    res.json({ message: 'Rating saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
