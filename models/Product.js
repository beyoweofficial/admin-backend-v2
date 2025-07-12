const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: [true, 'Product code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        // Allow alphanumeric characters only (letters and numbers)
        return /^[A-Z0-9]+$/.test(v);
      },
      message: 'Product code must contain only letters and numbers'
    }
  },
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
  stockQuantity: {
    type: Number,
    default: 0,
  },
  youtubeLink: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  bestSeller: {
    type: Boolean,
    default: false,
  },
  tags: [String],
}, { timestamps: true });

// Create compound index for better performance
productSchema.index({ productCode: 1 }, { unique: true });
productSchema.index({ name: 'text', productCode: 'text' });

module.exports = mongoose.model('Product', productSchema);
