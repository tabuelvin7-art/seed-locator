const express = require('express');
const Seller = require('../models/Seller');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/sellers
router.get('/', async (req, res) => {
  try {
    const sellers = await Seller.find().populate('user', 'username email phone');
    res.json(sellers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/sellers/:id
router.get('/:id', async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id).populate('user', 'username email phone');
    if (!seller) return res.status(404).json({ message: 'Seller not found' });
    res.json(seller);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/sellers - create seller profile
router.post('/', protect, requireRole('seller', 'admin'), async (req, res) => {
  try {
    const exists = await Seller.findOne({ user: req.user._id });
    if (exists) return res.status(400).json({ message: 'Seller profile already exists' });
    const seller = await Seller.create({ ...req.body, user: req.user._id });
    res.status(201).json(seller);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/sellers/me
router.put('/me', protect, requireRole('seller', 'admin'), async (req, res) => {
  try {
    const seller = await Seller.findOneAndUpdate({ user: req.user._id }, req.body, { new: true });
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });
    res.json(seller);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
