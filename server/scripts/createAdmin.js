/**
 * Run once to create the admin account:
 *   node scripts/createAdmin.js
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN = {
  username: 'admin',
  email: 'admin@gmail.com',
  password: 'Admin@254',
  role: 'admin',
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: ADMIN.email });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log('✓ Existing user promoted to admin');
    } else {
      console.log('✓ Admin account already exists');
    }
  } else {
    await User.create(ADMIN);
    console.log('✓ Admin account created:', ADMIN.email);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
