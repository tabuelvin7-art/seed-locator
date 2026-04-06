const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', [
  body('username').notEmpty().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character'),
  body('role').isIn(['farmer', 'seller', 'admin']).withMessage('Invalid role'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  const { username, email, password, role, phone } = req.body;
  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: 'An account with this email already exists' });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: 'Username is already taken' });

    const user = await User.create({ username, email, password, role, phone });
    res.status(201).json({ token: generateToken(user._id), user: { id: user._id, username, email, role } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration', detail: err.message });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json({ token: generateToken(user._id), user: { id: user._id, username: user.username, email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

// PUT /api/auth/me — update own profile
router.put('/me', protect, [
  body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone').optional(),
  body('newPassword').optional()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain uppercase')
    .matches(/[a-z]/).withMessage('Must contain lowercase')
    .matches(/[0-9]/).withMessage('Must contain a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Must contain a special character'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  const { username, email, phone, currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);

    if (username && username !== user.username) {
      const taken = await User.findOne({ username });
      if (taken) return res.status(400).json({ message: 'Username is already taken' });
      user.username = username;
    }
    if (email && email !== user.email) {
      const taken = await User.findOne({ email });
      if (taken) return res.status(400).json({ message: 'Email is already in use' });
      user.email = email;
    }
    if (phone !== undefined) user.phone = phone;

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: 'Current password required to set a new one' });
      const match = await user.matchPassword(currentPassword);
      if (!match) return res.status(400).json({ message: 'Current password is incorrect' });
      user.password = newPassword;
    }

    await user.save();
    res.json({ id: user._id, username: user.username, email: user.email, role: user.role, phone: user.phone });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/users — admin: list all users
router.get('/users', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/users/:id — admin: edit any user
router.put('/users/:id', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
  const { username, email, phone, role } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (username) user.username = username;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role && ['farmer', 'seller', 'admin'].includes(role)) user.role = role;
    await user.save();
    res.json({ id: user._id, username: user.username, email: user.email, role: user.role, phone: user.phone });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/auth/users/:id — admin: delete user
router.delete('/users/:id', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
  if (req.params.id === req.user._id.toString()) return res.status(400).json({ message: 'Cannot delete your own account' });
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/admin-register  — protected by ADMIN_SECRET key
router.post('/admin-register', async (req, res) => {
  const { secret, username, email, password } = req.body;

  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ message: 'Invalid admin secret key' });
  }

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email and password are required' });
  }

  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      // If already admin just return success
      if (existingEmail.role === 'admin') {
        return res.status(200).json({ message: 'Admin account already exists' });
      }
      // Promote existing user to admin
      existingEmail.role = 'admin';
      await existingEmail.save();
      return res.status(200).json({
        message: 'Existing user promoted to admin',
        token: generateToken(existingEmail._id),
        user: { id: existingEmail._id, username: existingEmail.username, email, role: 'admin' },
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: 'Username is already taken' });

    const user = await User.create({ username, email, password, role: 'admin' });
    res.status(201).json({
      message: 'Admin account created',
      token: generateToken(user._id),
      user: { id: user._id, username, email, role: 'admin' },
    });
  } catch (err) {
    console.error('Admin register error:', err);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

module.exports = router;
