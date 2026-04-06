const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  searchTerm: { type: String, required: true },
  category: { type: String },
  searchDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Search', searchSchema);
