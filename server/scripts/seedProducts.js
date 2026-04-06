/**
 * Seed dummy sellers and products (seeds & seedlings).
 * Run from the server/ directory:
 *   node scripts/seedProducts.js
 *
 * Options:
 *   --clear   Delete all existing products and dummy sellers before seeding
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');

const CLEAR = process.argv.includes('--clear');

// ── Dummy seller accounts ────────────────────────────────────────────────────
const SELLERS = [
  {
    user: { username: 'eldoret_agro', email: 'eldoretagro@gmail.com', password: 'Seller@254', role: 'seller', phone: '+254711000001' },
    profile: { businessName: 'Eldoret Agro Supplies', businessType: 'agro-dealer', location: 'Eldoret, Uasin Gishu', latitude: 0.5143, longitude: 35.2698, description: 'Leading agro-dealer in the Rift Valley supplying certified seeds and farm inputs.' },
  },
  {
    user: { username: 'nairobi_nursery', email: 'nairobinursery@gmail.com', password: 'Seller@254', role: 'seller', phone: '+254722000002' },
    profile: { businessName: 'Nairobi Green Nursery', businessType: 'nursery', location: 'Limuru, Kiambu', latitude: -1.1133, longitude: 36.6417, description: 'Specialist nursery for horticultural and indigenous tree seedlings.' },
  },
  {
    user: { username: 'kisumu_farmer', email: 'kisumufarmer@gmail.com', password: 'Seller@254', role: 'seller', phone: '+254733000003' },
    profile: { businessName: 'Kisumu Farmer Producers', businessType: 'farmer-producer', location: 'Kisumu, Nyanza', latitude: -0.0917, longitude: 34.7679, description: 'Farmer cooperative producing and selling open-pollinated seed varieties.' },
  },
];

// ── Products per seller (index matches SELLERS array) ───────────────────────
const PRODUCTS = [
  // Eldoret Agro Supplies — seeds focus
  [
    { name: 'H614D Hybrid Maize Seed', category: 'food-crop', type: 'seed', price: 850, stockQuantity: 200, description: 'High-yielding hybrid maize suited for mid-altitude areas. 90-day maturity.' },
    { name: 'DK8031 Maize Seed', category: 'food-crop', type: 'seed', price: 920, stockQuantity: 150, description: 'Drought-tolerant maize hybrid with excellent standability. Ideal for ASAL regions.' },
    { name: 'Sungold Sunflower Seed', category: 'industrial', type: 'seed', price: 480, stockQuantity: 300, description: 'High oil-content sunflower variety. Matures in 90–100 days.' },
    { name: 'Soya Bean SB19 Seed', category: 'industrial', type: 'seed', price: 560, stockQuantity: 180, description: 'Certified soya bean seed with high protein content. Good for Western Kenya.' },
    { name: 'Wheat Fahari Seed', category: 'food-crop', type: 'seed', price: 390, stockQuantity: 400, description: 'Rust-resistant wheat variety with high milling quality. Suited for highland areas.' },
    { name: 'Barley Nguzo Seed', category: 'food-crop', type: 'seed', price: 420, stockQuantity: 120, description: 'Malting barley variety recommended for high-altitude cool regions.' },
  ],
  // Nairobi Green Nursery — seedlings focus
  [
    { name: 'Tomato Kilele F1 Seedling', category: 'horticultural', type: 'seedling', price: 12, stockQuantity: 2000, description: 'Determinate tomato seedling with high resistance to bacterial wilt. 70-day maturity.' },
    { name: 'Capsicum California Wonder Seedling', category: 'horticultural', type: 'seedling', price: 15, stockQuantity: 1500, description: 'Large blocky sweet pepper seedling. Excellent shelf life and market demand.' },
    { name: 'Kale (Sukuma Wiki) Seedling', category: 'horticultural', type: 'seedling', price: 5, stockQuantity: 5000, description: 'Fast-growing collard greens seedling. Ready for transplant at 3–4 weeks.' },
    { name: 'Watermelon Sukari F1 Seedling', category: 'horticultural', type: 'seedling', price: 18, stockQuantity: 800, description: 'Sweet crispy watermelon seedling. Matures in 75 days. High market value.' },
    { name: 'Grevillea Tree Seedling', category: 'indigenous', type: 'seedling', price: 35, stockQuantity: 600, description: 'Fast-growing shade and timber tree. Excellent for agroforestry and windbreaks.' },
    { name: 'Moringa Seedling', category: 'indigenous', type: 'seedling', price: 25, stockQuantity: 900, description: 'Highly nutritious moringa seedling. Drought-tolerant and multi-purpose.' },
    { name: 'Avocado Hass Seedling', category: 'horticultural', type: 'seedling', price: 250, stockQuantity: 300, description: 'Grafted Hass avocado seedling. Starts bearing fruit in 2–3 years.' },
  ],
  // Kisumu Farmer Producers — mixed seeds
  [
    { name: 'Sorghum Gadam Seed', category: 'food-crop', type: 'seed', price: 280, stockQuantity: 500, description: 'Early-maturing sorghum variety. Drought-tolerant and suitable for low-rainfall areas.' },
    { name: 'Cowpea KVU 27-1 Seed', category: 'food-crop', type: 'seed', price: 320, stockQuantity: 350, description: 'High-yielding cowpea variety. Dual-purpose for grain and fodder.' },
    { name: 'Finger Millet P224 Seed', category: 'food-crop', type: 'seed', price: 260, stockQuantity: 280, description: 'Improved finger millet with good grain quality and blast resistance.' },
    { name: 'Sweet Potato Kemb10 Vine', category: 'food-crop', type: 'seedling', price: 8, stockQuantity: 3000, description: 'Vitamin A-rich orange-fleshed sweet potato vine. Matures in 3–4 months.' },
    { name: 'Cassava Miaka 4 Cutting', category: 'food-crop', type: 'seedling', price: 10, stockQuantity: 2500, description: 'Mosaic-resistant cassava cutting. High starch content, matures in 9 months.' },
    { name: 'Green Gram N26 Seed', category: 'food-crop', type: 'seed', price: 310, stockQuantity: 400, description: 'Short-season green gram variety. Matures in 60 days. Good for intercropping.' },
    { name: 'Bambara Groundnut Seed', category: 'indigenous', type: 'seed', price: 350, stockQuantity: 200, description: 'Drought-tolerant indigenous legume. Rich in protein and minerals.' },
  ],
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  if (CLEAR) {
    const emails = SELLERS.map(s => s.user.email);
    const usernames = SELLERS.map(s => s.user.username);
    const users = await User.find({ $or: [{ email: { $in: emails } }, { username: { $in: usernames } }] });
    const userIds = users.map(u => u._id);
    const sellers = await Seller.find({ user: { $in: userIds } });
    const sellerIds = sellers.map(s => s._id);
    const pDel = await Product.deleteMany({ seller: { $in: sellerIds } });
    const sDel = await Seller.deleteMany({ _id: { $in: sellerIds } });
    const uDel = await User.deleteMany({ _id: { $in: userIds } });
    console.log(`Cleared: ${uDel.deletedCount} users, ${sDel.deletedCount} sellers, ${pDel.deletedCount} products\n`);
  }

  for (let i = 0; i < SELLERS.length; i++) {
    const { user: userData, profile } = SELLERS[i];

    // Upsert user
    let user = await User.findOne({ email: userData.email });
    if (!user) {
      user = await User.create(userData);
      console.log(`✓ Created user: ${userData.username}`);
    } else {
      console.log(`→ User exists: ${userData.username}`);
    }

    // Upsert seller profile
    let seller = await Seller.findOne({ user: user._id });
    if (!seller) {
      seller = await Seller.create({ ...profile, user: user._id });
      console.log(`  ✓ Created seller profile: ${profile.businessName}`);
    } else {
      console.log(`  → Seller profile exists: ${profile.businessName}`);
    }

    // Insert products (skip duplicates by name + seller)
    let added = 0;
    for (const p of PRODUCTS[i]) {
      const exists = await Product.findOne({ seller: seller._id, name: p.name });
      if (!exists) {
        await Product.create({ ...p, seller: seller._id });
        added++;
      }
    }
    console.log(`  ✓ Added ${added} new product(s) (${PRODUCTS[i].length - added} already existed)\n`);
  }

  console.log('Done.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
