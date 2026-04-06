const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['food-crop', 'horticultural', 'industrial', 'indigenous'], required: true },
  type: { type: String, enum: ['seed', 'seedling'], required: true },
  description: { type: String },
  price: { type: Number, required: true },
  stockQuantity: { type: Number, default: 0 },
  image: { type: String },
  averageRating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
