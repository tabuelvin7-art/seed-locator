const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessName: { type: String, required: true },
  businessType: { type: String, enum: ['agro-dealer', 'nursery', 'farmer-producer'], required: true },
  description: { type: String },
  location: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  phone: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Seller', sellerSchema);
