const QuickShopping = require('../models/QuickShopping');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Get categories with all products (including subcategory products)
// This returns all categories and products in their DEFAULT order (no custom arrangement)
exports.getCategoriesWithProducts = async (req, res) => {
  try {
    console.log('Fetching categories with products in default order...');
    
    // Get all categories - sorted by name for consistent default ordering
    const categories = await Category.find().sort({ name: 1 });
    
    // Get all products and group by category
    const categoriesWithProducts = await Promise.all(
      categories.map(async (category) => {
        // Get all products in this category (including from subcategories)
        // Sort by name for consistent default ordering
        const products = await Product.find({
          categoryId: category._id,
          isActive: true
        })
        .select('_id name productCode price offerPrice images basePrice profitMarginPrice discountPercentage')
        .sort({ name: 1 });
        
        return {
          _id: category._id,
          name: category.name,
          products: products
        };
      })
    );
    
    // Filter out categories with no products
    const filteredCategories = categoriesWithProducts.filter(cat => cat.products.length > 0);
    
    console.log(`Found ${filteredCategories.length} categories with products in default order`);
    
    res.json({
      success: true,
      data: filteredCategories,
      message: 'Categories and products fetched in default order'
    });
  } catch (error) {
    console.error('Error fetching categories with products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories with products',
      error: error.message
    });
  }
};

// Get saved quick shopping order
// Returns saved custom arrangement or null if using default order
exports.getQuickShoppingOrder = async (req, res) => {
  try {
    console.log('Fetching saved quick shopping order for admin:', req.admin?._id);
    
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }
    
    const adminId = req.admin._id;
    const branch = req.admin.branch;
    
    const quickShopping = await QuickShopping.findOne({ adminId })
      .populate({
        path: 'categoryOrder.categoryId',
        select: 'name'
      })
      .populate({
        path: 'categoryOrder.products.productId',
        select: 'name productCode price offerPrice images basePrice profitMarginPrice'
      });
    
    if (!quickShopping) {
      console.log('No saved order found - using default order');
      return res.json({
        success: true,
        data: null,
        message: 'No custom order found - using default arrangement'
      });
    }
    
    console.log(`Found saved order with ${quickShopping.categoryOrder.length} categories`);
    
    res.json({
      success: true,
      data: quickShopping.categoryOrder,
      message: 'Custom order retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching quick shopping order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quick shopping order',
      error: error.message
    });
  }
};

// Save quick shopping order
// Saves custom arrangement to database, overriding default order
exports.saveQuickShoppingOrder = async (req, res) => {
  try {
    console.log('Saving quick shopping order for admin:', req.admin?._id);
    
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }
    
    const adminId = req.admin._id;
    const branch = req.admin.branch;
    const { categoryOrder } = req.body;
    
    // Validate the input
    if (!categoryOrder || !Array.isArray(categoryOrder)) {
      return res.status(400).json({
        success: false,
        message: 'Category order is required and must be an array'
      });
    }
    
    console.log(`Saving custom order with ${categoryOrder.length} categories`);
    
    // Check if this is an update or new creation
    const existingOrder = await QuickShopping.findOne({ adminId });
    const isUpdate = !!existingOrder;
    
    // Update or create quick shopping order
    const quickShopping = await QuickShopping.findOneAndUpdate(
      { adminId },
      {
        adminId,
        branch,
        categoryOrder
      },
      {
        new: true,
        upsert: true
      }
    );
    
    console.log(`Custom order ${isUpdate ? 'updated' : 'created'} successfully`);
    
    res.json({
      success: true,
      data: quickShopping,
      message: `Custom arrangement ${isUpdate ? 'updated' : 'saved'} successfully - now active as permanent order`,
      isUpdate
    });
  } catch (error) {
    console.error('Error saving quick shopping order:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving quick shopping order',
      error: error.message
    });
  }
};

// Reset quick shopping order
// Deletes saved custom arrangement and returns to default order
exports.resetQuickShoppingOrder = async (req, res) => {
  try {
    console.log('Resetting quick shopping order for admin:', req.admin?._id);
    
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }
    
    const adminId = req.admin._id;
    
    const deletedOrder = await QuickShopping.findOneAndDelete({ adminId });
    
    if (deletedOrder) {
      console.log(`Custom order deleted - returning to default arrangement`);
      res.json({
        success: true,
        message: 'Custom order reset successfully - now using default arrangement',
        data: { resetToDefault: true }
      });
    } else {
      console.log('No custom order found to delete');
      res.json({
        success: true,
        message: 'No custom order found - already using default arrangement',
        data: { resetToDefault: false }
      });
    }
  } catch (error) {
    console.error('Error resetting quick shopping order:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting quick shopping order',
      error: error.message
    });
  }
};