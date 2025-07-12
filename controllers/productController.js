const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

// Create product
exports.createProduct = async (req, res) => {
  try {
    const {
      productCode, name, description, price, offerPrice, categoryId,
      subcategoryId, inStock = true, bestSeller = false, tags,
    } = req.body;

    // Validate required fields
    if (!productCode) {
      return res.status(400).json({ message: 'Product code is required' });
    }

    // Check if product code already exists
    const existingProduct = await Product.findOne({ productCode: productCode.toUpperCase() });
    if (existingProduct) {
      return res.status(409).json({ message: 'Product code already exists. Please use a unique code.' });
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

    const product = new Product({
      productCode: productCode.toUpperCase(),
      name,
      description,
      price,
      offerPrice,
      categoryId,
      subcategoryId,
      images: uploadedImages,
      inStock,
      bestSeller,
      tags: tags?.split(',').map(tag => tag.trim()),
    });

    await product.save();
    res.status(201).json(product);

  } catch (error) {
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
      categoryId, subcategoryId, tag, bestSeller, search,
      page = 1, limit = 10,
    } = req.query;

    const filter = {};

    if (categoryId) filter.categoryId = categoryId;
    if (subcategoryId) filter.subcategoryId = subcategoryId;
    if (bestSeller === 'true') filter.bestSeller = true;
    if (tag) filter.tags = { $in: [tag] };
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
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Fetching products failed', error: error.message });
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
      price: product.price,
      offerPrice: product.offerPrice,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      images: product.images,
      inStock: product.inStock,
      bestSeller: product.bestSeller,
      tags: product.tags,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
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
      productCode, name, description, price, offerPrice, categoryId,
      subcategoryId, inStock, bestSeller, tags,
    } = req.body;

    const product = await Product.findById(id);
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

    product.name = name;
    product.description = description;
    product.price = price;
    product.offerPrice = offerPrice;
    product.categoryId = categoryId;
    product.subcategoryId = subcategoryId;
    product.inStock = inStock;
    product.bestSeller = bestSeller;
    product.tags = tags?.split(',').map(tag => tag.trim());

    await product.save();
    res.json(product);

  } catch (error) {
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
      outOfStock,
      inStock,
      productsWithOffer,
      totalValueResult
    ] = await Promise.all([
      // Total number of products
      Product.countDocuments(),
      
      // Products marked as best sellers
      Product.countDocuments({ bestSeller: true }),
      
      // Products that are out of stock
      Product.countDocuments({ inStock: false }),
      
      // Products that are in stock
      Product.countDocuments({ inStock: true }),
      
      // Products with offer price (offer price exists and is less than regular price)
      Product.countDocuments({
        offerPrice: { $exists: true, $gt: 0 },
        $expr: { $lt: ["$offerPrice", "$price"] }
      }),
      
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

    // Prepare response
    const stats = {
      totalProducts,
      bestSellers,
      outOfStock,
      inStock,
      productsWithOffer,
      productsOriginalPrice
    };

    console.log('Dashboard stats calculated:', stats);

    res.status(200).json(stats);
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
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
