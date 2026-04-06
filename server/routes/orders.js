const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders — buyer places an order
router.post('/', protect, async (req, res) => {
  const { items, deliveryAddress, phone, notes } = req.body;
  if (!items?.length) return res.status(400).json({ message: 'No items in order' });
  if (!deliveryAddress) return res.status(400).json({ message: 'Delivery address required' });
  if (!phone) return res.status(400).json({ message: 'Phone number required' });

  try {
    // All items must belong to the same seller (one order per seller)
    const productIds = items.map(i => i.product);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== items.length) {
      return res.status(400).json({ message: 'One or more products not found' });
    }

    // Verify all products belong to the same seller
    const sellerIds = [...new Set(products.map(p => p.seller.toString()))];
    if (sellerIds.length > 1) {
      return res.status(400).json({ message: 'All items in an order must be from the same seller' });
    }

    const sellerId = sellerIds[0];

    // Check stock and build order items
    const orderItems = [];
    let total = 0;
    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.product);
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for "${product.name}"` });
      }
      orderItems.push({ product: product._id, name: product.name, price: product.price, quantity: item.quantity });
      total += product.price * item.quantity;
    }

    // Deduct stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stockQuantity: -item.quantity } });
    }

    const order = await Order.create({
      buyer: req.user._id,
      seller: sellerId,
      items: orderItems,
      total,
      deliveryAddress,
      phone,
      notes,
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/my — buyer's own orders
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate({ path: 'seller', select: 'businessName location phone' })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/seller — seller's incoming orders
router.get('/seller', protect, requireRole('seller', 'admin'), async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });

    const orders = await Order.find({ seller: seller._id })
      .populate('buyer', 'username email phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/:id — get single order (buyer or seller)
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'username email phone')
      .populate({ path: 'seller', populate: { path: 'user', select: 'username email' } });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isBuyer = order.buyer._id.toString() === req.user._id.toString();
    const sellerUser = await Seller.findById(order.seller._id);
    const isSeller = sellerUser?.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/orders/:id/cancel — buyer cancels a pending order
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.buyer.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Access denied' });
    if (order.status !== 'pending') return res.status(400).json({ message: 'Only pending orders can be cancelled' });

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stockQuantity: item.quantity } });
    }
    order.status = 'cancelled';
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/orders/:id/status — seller updates order status
router.patch('/:id/status', protect, requireRole('seller', 'admin'), async (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Verify seller owns this order
    if (req.user.role !== 'admin') {
      const seller = await Seller.findOne({ user: req.user._id });
      if (!seller || order.seller.toString() !== seller._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Restore stock if cancelling
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stockQuantity: item.quantity } });
      }
    }

    order.status = status;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
