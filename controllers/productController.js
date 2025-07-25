const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

// Create product
exports.createProduct = async (req, res) => {
  try {
    const {
      productCode, name, description, 
      // New pricing fields
      basePrice, profitMarginPercentage = 65, discountPercentage = 81,
      // Legacy fields for backward compatibility
      price, offerPrice, 
      categoryId, subcategoryId, inStock = true, bestSeller = false, featured = false, tags,
      stockQuantity = 0, youtubeLink = '', isActive = true,
      // New inventory fields
      receivedDate, caseQuantity = '', receivedCase = 0, brandName = '', totalAvailableQuantity,
      // Supplier fields
      supplierName = '', supplierPhone = '',
      // Customer quantity limit
      maxQuantityPerCustomer
    } = req.body;

    // Validate required fields
    if (!productCode) {
      return res.status(400).json({ message: 'Product code is required' });
    }

    // Validate pricing fields
    if (!basePrice && !price) {
      return res.status(400).json({ message: 'Base price is required' });
    }

    // Calculate pricing using the new system
    const finalBasePrice = parseFloat(basePrice || price); // Convert to number and use basePrice if provided, otherwise fall back to legacy price
    
    // Validate that finalBasePrice is a valid number
    if (isNaN(finalBasePrice) || finalBasePrice <= 0) {
      return res.status(400).json({ message: 'Base price must be a valid positive number' });
    }
    
    // Ensure all pricing parameters are numbers
    const finalProfitMarginPercentage = parseFloat(profitMarginPercentage) || 65;
    const finalDiscountPercentage = parseFloat(discountPercentage) || 81;
    
    const pricingDetails = Product.calculatePricing(
      finalBasePrice,
      finalProfitMarginPercentage,
      finalDiscountPercentage
    );

    console.log('💰 Creating product with pricing:', {
      basePrice: finalBasePrice,
      profitMarginPercentage: finalProfitMarginPercentage,
      discountPercentage: finalDiscountPercentage
    });

    // Check if product code already exists
    const existingProduct = await Product.findOne({ productCode: productCode.toUpperCase() });
    if (existingProduct) {
      return res.status(409).json({ message: 'Product code already exists. Please use a unique code.' });
    }

    // Validate mutual exclusivity between bestSeller and featured
    if (bestSeller && featured) {
      return res.status(400).json({ 
        message: 'A product cannot be both a bestseller and featured product at the same time. Please select only one option.' 
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least 1 image required' });
    }

    if (req.files.length > 3) {
      return res.status(400).json({ message: 'Max 3 images allowed' });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'products' },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        ).end(file.buffer);
      });

      uploadedImages.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    const productData = {
      productCode: productCode.toUpperCase(),
      name,
      description,
      // New pricing fields
      basePrice: finalBasePrice,
      profitMarginPercentage: finalProfitMarginPercentage,
      discountPercentage: finalDiscountPercentage,
      profitMarginPrice: pricingDetails.profitMarginPrice,
      calculatedOriginalPrice: pricingDetails.calculatedOriginalPrice,
      offerPrice: pricingDetails.offerPrice,
      // Legacy price field
      price: pricingDetails.price,
      categoryId,
      subcategoryId,
      images: uploadedImages,
      inStock,
      bestSeller,
      featured,
      stockQuantity,
      youtubeLink,
      isActive,
      tags: tags?.split(',').map(tag => tag.trim()),
      // New inventory fields
      receivedDate,
      caseQuantity,
      receivedCase: parseInt(receivedCase) || 0,
      brandName,
      totalAvailableQuantity: totalAvailableQuantity ? parseInt(totalAvailableQuantity) : undefined, // If provided, use it; otherwise let middleware calculate
      // Supplier fields
      supplierName,
      supplierPhone,
      // Customer quantity limit
      maxQuantityPerCustomer: maxQuantityPerCustomer ? parseInt(maxQuantityPerCustomer) : null,
    };

    const product = new Product(productData);
    await product.save();
    
    // Return the created product with populated category and subcategory
    const createdProduct = await Product.findById(product._id)
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name');
      
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: createdProduct
    });

  } catch (error) {
    console.error('Error creating product:', error);
    
    // Handle duplicate product code error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.productCode) {
      return res.status(409).json({ message: 'Product code already exists. Please use a unique code.' });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }
    
    res.status(500).json({ message: 'Product creation failed', error: error.message });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const {
      categoryId, subcategoryId, tag, bestSeller, featured, search,
      page = 1, limit = 10, isActive, inStock, minStock, maxStock
    } = req.query;

    const filter = {};

    if (categoryId) filter.categoryId = categoryId;
    if (subcategoryId) filter.subcategoryId = subcategoryId;
    if (bestSeller === 'true') filter.bestSeller = true;
    if (featured === 'true') filter.featured = true;
    if (featured === 'false') filter.featured = false;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (inStock !== undefined) filter.inStock = inStock === 'true';
    if (tag) filter.tags = { $in: [tag] };
    
    // Stock quantity filter
    if (minStock !== undefined || maxStock !== undefined) {
      filter.stockQuantity = {};
      if (minStock !== undefined) filter.stockQuantity.$gte = Number(minStock);
      if (maxStock !== undefined) filter.stockQuantity.$lte = Number(maxStock);
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false,
      message: 'Fetching products failed', 
      error: error.message 
    });
  }
};

// Get product by ID - Detailed view
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const product = await Product.findById(id)
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Calculate savings if offer price exists
    const savings = product.offerPrice && product.offerPrice > 0 
      ? product.price - product.offerPrice 
      : 0;

    const savingsPercentage = savings > 0 
      ? Math.round((savings / product.price) * 100) 
      : 0;

    // Enhanced product data with detailed information
    const productDetails = {
      _id: product._id,
      productCode: product.productCode,
      name: product.name,
      description: product.description,
      // Legacy price fields
      price: product.price,
      offerPrice: product.offerPrice,
      // New pricing fields
      basePrice: product.basePrice,
      profitMarginPercentage: product.profitMarginPercentage,
      profitMarginPrice: product.profitMarginPrice,
      discountPercentage: product.discountPercentage,
      calculatedOriginalPrice: product.calculatedOriginalPrice,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      images: product.images,
      inStock: product.inStock,
      stockQuantity: product.stockQuantity || 0,
      youtubeLink: product.youtubeLink || '',
      isActive: product.isActive !== undefined ? product.isActive : true,
      bestSeller: product.bestSeller,
      tags: product.tags,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      // New inventory fields
      receivedDate: product.receivedDate,
      caseQuantity: product.caseQuantity,
      receivedCase: product.receivedCase,
      brandName: product.brandName,
      totalAvailableQuantity: product.totalAvailableQuantity,
      // Supplier fields
      supplierName: product.supplierName,
      supplierPhone: product.supplierPhone,
      // Additional calculated fields
      savings: savings,
      savingsPercentage: savingsPercentage,
      hasOffer: product.offerPrice && product.offerPrice > 0,
      finalPrice: product.offerPrice && product.offerPrice > 0 ? product.offerPrice : product.price,
      imageCount: product.images.length,
      tagCount: product.tags.length
    };

    res.status(200).json({
      success: true,
      product: productDetails
    });

  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ 
      message: 'Failed to fetch product details', 
      error: error.message 
    });
  }
};


// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      productCode, name, description, 
      // New pricing fields
      basePrice, profitMarginPercentage, discountPercentage,
      // Legacy fields for backward compatibility
      price, offerPrice, 
      categoryId, subcategoryId, inStock, bestSeller, featured, tags, stockQuantity, youtubeLink,
      isActive, removeImages,
      // New inventory fields
      receivedDate, caseQuantity, receivedCase, brandName, totalAvailableQuantity,
      // Supplier fields
      supplierName, supplierPhone,
      // Customer quantity limit
      maxQuantityPerCustomer
    } = req.body;

    const product = await Product.findById(id)
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name');
      
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Check if product code is being updated and if it's unique
    if (productCode && productCode.toUpperCase() !== product.productCode) {
      const existingProduct = await Product.findOne({ 
        productCode: productCode.toUpperCase(),
        _id: { $ne: id } // Exclude current product
      });
      if (existingProduct) {
        return res.status(409).json({ message: 'Product code already exists. Please use a unique code.' });
      }
      product.productCode = productCode.toUpperCase();
    }

    // Handle image updates
    let currentImages = [...product.images];
    
    // Remove images if specified
    if (removeImages) {
      const imagesToRemove = removeImages.split(',').map(id => id.trim());
      
      // Delete images from Cloudinary
      for (const publicId of imagesToRemove) {
        const imageToDelete = currentImages.find(img => img.publicId === publicId);
        if (imageToDelete) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
      
      // Filter out removed images
      currentImages = currentImages.filter(img => !imagesToRemove.includes(img.publicId));
    }
    
    // Add new images if provided
    if (req.files && req.files.length > 0) {
      // Check if total images would exceed limit
      if (currentImages.length + req.files.length > 3) {
        return res.status(400).json({ 
          message: 'Maximum 3 images allowed. Please remove some existing images first.' 
        });
      }
      
      // Upload new images to Cloudinary
      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: 'products' },
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          ).end(file.buffer);
        });

        currentImages.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    }
    
    // Validate mutual exclusivity between bestSeller and featured before updating
    const newBestSeller = bestSeller !== undefined ? bestSeller : product.bestSeller;
    const newFeatured = featured !== undefined ? featured : product.featured;
    
    if (newBestSeller && newFeatured) {
      return res.status(400).json({ 
        message: 'A product cannot be both a bestseller and featured product at the same time. Please select only one option.' 
      });
    }

    // Update product fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.categoryId = categoryId || product.categoryId;
    product.subcategoryId = subcategoryId || product.subcategoryId;
    product.inStock = inStock !== undefined ? inStock : product.inStock;
    product.bestSeller = newBestSeller;
    product.featured = newFeatured;
    product.youtubeLink = youtubeLink !== undefined ? youtubeLink : product.youtubeLink;
    product.isActive = isActive !== undefined ? isActive : product.isActive;
    
    // Update pricing fields if provided
    if (basePrice !== undefined) {
      const finalBasePrice = parseFloat(basePrice);
      const finalProfitMarginPercentage = parseFloat(profitMarginPercentage) || product.profitMarginPercentage;
      const finalDiscountPercentage = parseFloat(discountPercentage) || product.discountPercentage;
      
      if (finalBasePrice > 0) {
        product.updatePricing(finalBasePrice, finalProfitMarginPercentage, finalDiscountPercentage);
      }
    }
    
    // Update inventory fields if provided
    if (caseQuantity !== undefined || receivedCase !== undefined || brandName !== undefined || totalAvailableQuantity !== undefined) {
      product.updateInventory(
        receivedCase !== undefined ? parseInt(receivedCase) : undefined,
        caseQuantity,
        brandName,
        totalAvailableQuantity !== undefined ? parseInt(totalAvailableQuantity) : undefined
      );
    }
    
    // Update supplier fields
    if (supplierName !== undefined) {
      product.supplierName = supplierName;
    }
    if (supplierPhone !== undefined) {
      product.supplierPhone = supplierPhone;
    }
    
    // Update customer quantity limit
    if (maxQuantityPerCustomer !== undefined) {
      product.maxQuantityPerCustomer = maxQuantityPerCustomer ? parseInt(maxQuantityPerCustomer) : null;
    }
    
    if (tags) {
      product.tags = tags.split(',').map(tag => tag.trim());
    }
    
    // Update images
    product.images = currentImages;

    await product.save();
    
    // Return the updated product with populated category and subcategory
    const updatedProduct = await Product.findById(id)
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name');
      
    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Error updating product:', error);
    
    // Handle duplicate product code error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.productCode) {
      return res.status(409).json({ message: 'Product code already exists. Please use a unique code.' });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }
    
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

// Delete product (and images from Cloudinary)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    for (const img of product.images) {
      await cloudinary.uploader.destroy(img.publicId);
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};

// Check if product code is available
exports.checkProductCodeAvailability = async (req, res) => {
  try {
    const { productCode } = req.params;
    
    if (!productCode) {
      return res.status(400).json({ message: 'Product code is required' });
    }

    const existingProduct = await Product.findOne({ 
      productCode: productCode.toUpperCase() 
    });

    const isAvailable = !existingProduct;
    
    res.status(200).json({
      productCode: productCode.toUpperCase(),
      isAvailable: isAvailable,
      message: isAvailable ? 'Product code is available' : 'Product code is already taken'
    });

  } catch (error) {
    res.status(500).json({ message: 'Check failed', error: error.message });
  }
};



/**
 * @route   GET /products/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin only)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Execute all queries in parallel for better performance
    const [
      totalProducts,
      bestSellers,
      featuredProducts,
      outOfStock,
      inStock,
      productsWithOffer,
      activeProducts,
      inactiveProducts,
      totalStockQuantity,
      totalValueResult
    ] = await Promise.all([
      // Total number of products
      Product.countDocuments(),
      
      // Products marked as best sellers
      Product.countDocuments({ bestSeller: true }),
      
      // Products marked as featured
      Product.countDocuments({ featured: true }),
      
      // Products that are out of stock
      Product.countDocuments({ inStock: false }),
      
      // Products that are in stock
      Product.countDocuments({ inStock: true }),
      
      // Products with offer price (offer price exists and is less than regular price)
      Product.countDocuments({
        offerPrice: { $exists: true, $gt: 0 },
        $expr: { $lt: ["$offerPrice", "$price"] }
      }),
      
      // Active products
      Product.countDocuments({ isActive: true }),
      
      // Inactive products
      Product.countDocuments({ isActive: false }),
      
      // Total stock quantity
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalStock: { $sum: "$stockQuantity" }
          }
        }
      ]),
      
      // Calculate total value of all products
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalValue: { $sum: "$price" }
          }
        }
      ])
    ]);

    // Extract total value from aggregation result
    const productsOriginalPrice = totalValueResult.length > 0 
      ? totalValueResult[0].totalValue 
      : 0;
      
    // Extract total stock quantity from aggregation result
    const totalStock = totalStockQuantity.length > 0 
      ? totalStockQuantity[0].totalStock 
      : 0;

    // Prepare response
    const stats = {
      totalProducts,
      bestSellers,
      featuredProducts,
      outOfStock,
      inStock,
      productsWithOffer,
      activeProducts,
      inactiveProducts,
      totalStock,
      productsOriginalPrice
    };

    console.log('Dashboard stats calculated:', stats);

    res.status(200).json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message 
    });
  }
};

/**
 * @route   GET /api/products/stats/categories
 * @desc    Get product counts by category and subcategory
 * @access  Public
 */
exports.getProductCountsByCategory = async (req, res) => {
  try {
    // Get counts by category
    const categoryCounts = await Product.aggregate([
      {
        $group: {
          _id: "$categoryId",
          totalProducts: { $sum: 1 },
          directProducts: { 
            $sum: { 
              $cond: [{ $eq: ["$subcategoryId", null] }, 1, 0] 
            } 
          },
          subcategoryProducts: { 
            $sum: { 
              $cond: [{ $ne: ["$subcategoryId", null] }, 1, 0] 
            } 
          }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          categoryId: "$_id",
          categoryName: "$category.name",
          totalProducts: 1,
          directProducts: 1,
          subcategoryProducts: 1
        }
      }
    ]);

    // Get counts by subcategory
    const subcategoryCounts = await Product.aggregate([
      {
        $match: {
          subcategoryId: { $ne: null }
        }
      },
      {
        $group: {
          _id: "$subcategoryId",
          productCount: { $sum: 1 },
          categoryId: { $first: "$categoryId" }
        }
      },
      {
        $lookup: {
          from: "subcategories",
          localField: "_id",
          foreignField: "_id",
          as: "subcategory"
        }
      },
      {
        $unwind: {
          path: "$subcategory",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          subcategoryId: "$_id",
          subcategoryName: "$subcategory.name",
          categoryId: 1,
          categoryName: "$category.name",
          productCount: 1
        }
      }
    ]);

    // Get total product count
    const totalProducts = await Product.countDocuments();

    res.status(200).json({
      totalProducts,
      categoryCounts,
      subcategoryCounts
    });
    
  } catch (error) {
    console.error('Error fetching category statistics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch category statistics',
      error: error.message 
    });
  }
};

/**
 * @route   GET /products/featured
 * @desc    Get all featured products
 * @access  Public
 */
exports.getFeaturedProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const filter = { 
      featured: true, 
      isActive: true 
    };
    
    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      message: `Found ${total} featured products`
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch featured products', 
      error: error.message 
    });
  }
};

/**
 * @route   GET /products/best-sellers
 * @desc    Get all best seller products
 * @access  Public
 */
exports.getBestSellerProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const filter = { 
      bestSeller: true, 
      isActive: true 
    };
    
    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      message: `Found ${total} best seller products`
    });
  } catch (error) {
    console.error('Error fetching best seller products:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch best seller products', 
      error: error.message 
    });
  }
};

/**
 * @route   PATCH /products/:id/toggle-featured
 * @desc    Toggle featured status of a product
 * @access  Private (Admin only)
 */
exports.toggleFeaturedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // If trying to set featured to true, ensure bestSeller is false
    const newFeaturedStatus = !product.featured;
    if (newFeaturedStatus && product.bestSeller) {
      product.bestSeller = false;
    }
    
    product.featured = newFeaturedStatus;
    await product.save();
    
    const statusMessage = product.featured ? 'marked as featured' : 'removed from featured';
    
    res.json({
      success: true,
      message: `Product ${statusMessage} successfully`,
      product: {
        _id: product._id,
        name: product.name,
        featured: product.featured,
        bestSeller: product.bestSeller
      }
    });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to toggle featured status', 
      error: error.message 
    });
  }
};

/**
 * @route   PATCH /products/:id/toggle-bestseller
 * @desc    Toggle best seller status of a product
 * @access  Private (Admin only)
 */
exports.toggleBestSellerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // If trying to set bestSeller to true, ensure featured is false
    const newBestSellerStatus = !product.bestSeller;
    if (newBestSellerStatus && product.featured) {
      product.featured = false;
    }
    
    product.bestSeller = newBestSellerStatus;
    await product.save();
    
    const statusMessage = product.bestSeller ? 'marked as best seller' : 'removed from best sellers';
    
    res.json({
      success: true,
      message: `Product ${statusMessage} successfully`,
      product: {
        _id: product._id,
        name: product.name,
        featured: product.featured,
        bestSeller: product.bestSeller
      }
    });
  } catch (error) {
    console.error('Error toggling best seller status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to toggle best seller status', 
      error: error.message 
    });
  }
};
