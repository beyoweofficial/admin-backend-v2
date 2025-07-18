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
  
  // ====== NEW PRICING SYSTEM ======
  // This pricing system allows flexible pricing with automatic calculations
  // 
  // Flow:
  // 1. Admin enters basePrice (e.g., 100)
  // 2. System calculates profitMarginPrice = basePrice + (basePrice * profitMarginPercentage/100)
  // 3. System calculates calculatedOriginalPrice = profitMarginPrice / (1 - discountPercentage/100)
  // 4. Customer sees: ~~calculatedOriginalPrice~~ **profitMarginPrice** (discountPercentage% OFF!)
  // 5. Customer pays: profitMarginPrice (which becomes offerPrice)
  //
  // Example: basePrice=100, profitMargin=65%, discount=81%
  // → profitMarginPrice=165, calculatedOriginalPrice=868.42, offerPrice=165
  // → Customer sees: ~~₹868.42~~ **₹165** (81% OFF!)
  
  basePrice: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        return v > 0;
      },
      message: 'Base price must be greater than 0'
    }
  },
  profitMarginPercentage: {
    type: Number,
    default: 65, // Default 65% profit margin
    min: 0,
    validate: {
      validator: function(v) {
        return v >= 0 && v <= 1000; // Allow up to 1000% profit margin
      },
      message: 'Profit margin percentage must be between 0 and 1000'
    }
  },
  profitMarginPrice: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Profit margin price must be non-negative'
    }
  },
  discountPercentage: {
    type: Number,
    default: 81, // Default 81% discount
    min: 0,
    max: 99.99,
    validate: {
      validator: function(v) {
        return v >= 0 && v < 100; // Discount can't be 100% or more
      },
      message: 'Discount percentage must be between 0 and 99.99'
    }
  },
  calculatedOriginalPrice: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Calculated original price must be non-negative'
    }
  },
  offerPrice: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Offer price must be non-negative'
    }
  },
  
  // Legacy fields for backward compatibility
  price: {
    type: Number,
    required: true,
  },
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
  
  // ====== NEW INVENTORY FIELDS ======
  receivedDate: {
    type: String,
    required: false, // Will be auto-generated in pre-save middleware if not provided
    validate: {
      validator: function(v) {
        // Allow empty/undefined values (will be auto-generated)
        if (!v) return true;
        // Validate DD-MM-YYYY format
        return /^\d{2}-\d{2}-\d{4}$/.test(v);
      },
      message: 'Received date must be in DD-MM-YYYY format'
    }
  },
  caseQuantity: {
    type: String,
    default: '',
    trim: true,
    // Format: "qty:100 box" or similar
  },
  receivedCase: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Received case must be non-negative'
    }
  },
  brandName: {
    type: String,
    default: '',
    trim: true,
  },
  totalAvailableQuantity: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Total available quantity must be non-negative'
    }
  },
  
  // ====== SUPPLIER FIELDS ======
  supplierName: {
    type: String,
    default: '',
    trim: true,
  },
  supplierPhone: {
    type: String,
    default: '',
    trim: true,
    validate: {
      validator: function(v) {
        // Allow empty values (optional field)
        if (!v) return true;
        // Basic phone number validation (10 digits)
        return /^\d{10}$/.test(v);
      },
      message: 'Supplier phone must be 10 digits'
    }
  },
}, { timestamps: true });

// Pre-save middleware for auto-generation of fields
productSchema.pre('save', function(next) {
  // Auto-generate received date if not provided (DD-MM-YYYY format)
  if (!this.receivedDate) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    this.receivedDate = `${day}-${month}-${year}`;
  }
  
  next();
});

// Static method to calculate pricing and inventory
productSchema.statics.calculatePricing = function(basePrice, profitMarginPercentage = 65, discountPercentage = 81) {
  const profitMarginPrice = basePrice + (basePrice * (profitMarginPercentage / 100));
  const calculatedOriginalPrice = profitMarginPrice / (1 - (discountPercentage / 100));
  const offerPrice = profitMarginPrice;
  
  return {
    basePrice,
    profitMarginPercentage,
    profitMarginPrice,
    discountPercentage,
    calculatedOriginalPrice,
    offerPrice,
    price: calculatedOriginalPrice // Legacy field
  };
};

// Static method to calculate total available quantity
productSchema.statics.calculateTotalQuantity = function(receivedCase, caseQuantity) {
  if (!receivedCase || !caseQuantity) return 0;
  
  // Extract numeric value from caseQuantity (e.g., "qty:100 box" -> 100)
  const qtyMatch = caseQuantity.match(/(\d+)/);
  if (qtyMatch) {
    const qty = parseInt(qtyMatch[1]);
    return receivedCase * qty;
  }
  return 0;
};

// Method to update pricing when base price or margins change
productSchema.methods.updatePricing = function(newBasePrice, newProfitMarginPercentage, newDiscountPercentage) {
  this.basePrice = newBasePrice || this.basePrice;
  this.profitMarginPercentage = newProfitMarginPercentage || this.profitMarginPercentage;
  this.discountPercentage = newDiscountPercentage || this.discountPercentage;
  
  // Recalculate all prices
  this.profitMarginPrice = this.basePrice + (this.basePrice * (this.profitMarginPercentage / 100));
  this.calculatedOriginalPrice = this.profitMarginPrice / (1 - (this.discountPercentage / 100));
  this.offerPrice = this.profitMarginPrice;
  this.price = this.calculatedOriginalPrice; // Legacy field
  
  return this;
};

// Method to update inventory fields
productSchema.methods.updateInventory = function(newReceivedCase, newCaseQuantity, newBrandName, newTotalAvailableQuantity) {
  this.receivedCase = newReceivedCase !== undefined ? newReceivedCase : this.receivedCase;
  this.caseQuantity = newCaseQuantity !== undefined ? newCaseQuantity : this.caseQuantity;
  this.brandName = newBrandName !== undefined ? newBrandName : this.brandName;
  
  // Update received date when inventory is updated
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  this.receivedDate = `${day}-${month}-${year}`;
  
  // Handle total available quantity
  if (newTotalAvailableQuantity !== undefined) {
    // If manually provided, use it
    this.totalAvailableQuantity = newTotalAvailableQuantity;
  } else {
    // Otherwise, calculate from receivedCase and caseQuantity
    if (this.receivedCase && this.caseQuantity) {
      const qtyMatch = this.caseQuantity.match(/(\d+)/);
      if (qtyMatch) {
        const qty = parseInt(qtyMatch[1]);
        this.totalAvailableQuantity = this.receivedCase * qty;
      } else {
        this.totalAvailableQuantity = 0;
      }
    } else {
      this.totalAvailableQuantity = 0;
    }
  }
  
  // Update stock quantity from total available quantity
  this.stockQuantity = this.totalAvailableQuantity;
  
  return this;
};

// Create compound index for better performance
productSchema.index({ productCode: 1 }, { unique: true });
productSchema.index({ name: 'text', productCode: 'text' });

module.exports = mongoose.model('Product', productSchema);
