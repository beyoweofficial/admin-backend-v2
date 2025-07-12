const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  price: {
    type: Number,
    required: true,
  },
  offerPrice: Number,
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  subcategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory',
    required: true,
  },
  images: [
    {
      url: String,
      publicId: String,
    },
  ],
  inStock: {
    type: Boolean,
    default: true,
  },
  bestSeller: {
    type: Boolean,
    default: false,
  },
  tags: [String],
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
