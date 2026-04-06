const express = require('express');
const Product = require('../models/Product');
const User = require('../models/User');
const Search = require('../models/Search');
const Rating = require('../models/Rating');
const Seller = require('../models/Seller');
const Order = require('../models/Order');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/overview - admin
router.get('/overview', protect, requireRole('admin'), async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalSellers, totalSearches, topRated, recentSearches, allUsers, allProducts, allOrders] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Seller.countDocuments(),
      Search.countDocuments(),
      Product.find().sort({ averageRating: -1 }).limit(5).populate('seller', 'businessName location'),
      Search.find().sort({ searchDate: -1 }).limit(10).populate('user', 'username'),
      User.find().select('-password').sort({ createdAt: -1 }).limit(50),
      Product.find().populate({ path: 'seller', populate: { path: 'user', select: 'username email' } }).sort({ createdAt: -1 }).limit(50),
      Order.find().populate('buyer', 'username').populate('seller', 'businessName').sort({ createdAt: -1 }).limit(100),
    ]);

    const usersByRole = {
      farmer: await User.countDocuments({ role: 'farmer' }),
      seller: await User.countDocuments({ role: 'seller' }),
      admin: await User.countDocuments({ role: 'admin' }),
    };

    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $in: ['confirmed', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    res.json({
      totalUsers, totalProducts, totalSellers, totalSearches,
      totalOrders, totalRevenue: totalRevenue[0]?.total || 0,
      topRated, recentSearches, allUsers, allProducts, allOrders, usersByRole,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/seller - seller analytics
router.get('/seller', protect, requireRole('seller', 'admin'), async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id }).populate('user', 'username email phone');
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });

    const products = await Product.find({ seller: seller._id }).sort({ createdAt: -1 });
    const productIds = products.map(p => p._id);
    const ratings = await Rating.find({ product: { $in: productIds } })
      .populate('user', 'username')
      .populate('product', 'name')
      .sort({ createdAt: -1 });

    const orders = await Order.find({ seller: seller._id });
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const revenue = orders
      .filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + o.total, 0);

    const productStats = products.map(p => ({
      _id: p._id,
      name: p.name,
      category: p.category,
      type: p.type,
      stock: p.stockQuantity,
      price: p.price,
      rating: p.averageRating,
      ratingCount: p.ratingCount,
      createdAt: p.createdAt,
    }));

    res.json({
      seller: { businessName: seller.businessName, location: seller.location, businessType: seller.businessType },
      totalProducts: products.length,
      totalRatings: ratings.length,
      totalOrders,
      pendingOrders,
      revenue,
      productStats,
      recentRatings: ratings.slice(0, 20),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
