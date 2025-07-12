const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

// Create product
exports.createProduct = async (req, res) => {
  try {
    const {
      name, description, price, offerPrice, categoryId,
      subcategoryId, inStock = true, bestSeller = false, tags,
    } = req.body;

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
    if (search) filter.name = { $regex: search, $options: 'i' };

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


// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name, description, price, offerPrice, categoryId,
      subcategoryId, inStock, bestSeller, tags,
    } = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

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


exports.getAllProducts = async (req, res) => {
  try {
    const { categoryId, subcategoryId, tag, bestSeller, search } = req.query;
    const filter = {};

    if (categoryId) filter.categoryId = categoryId;
    if (subcategoryId) filter.subcategoryId = subcategoryId;
    if (bestSeller === 'true') filter.bestSeller = true;
    if (tag) filter.tags = { $in: [tag] };
    if (search) filter.name = { $regex: search, $options: 'i' };

    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Fetching products failed', error: error.message });
  }
};


exports.getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const bestSellers = await Product.countDocuments({ bestSeller: true });
    const outOfStock = await Product.countDocuments({ inStock: false });

    res.json({
      totalProducts,
      bestSellers,
      outOfStock,
    });
  } catch (error) {
    res.status(500).json({ message: 'Stats error', error: error.message });
  }
};
