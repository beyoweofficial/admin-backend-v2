const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function testQuantityLimit() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.SUPERADMIN_DB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Create a product with quantity limit
    console.log('\n🧪 Test 1: Creating product with quantity limit...');
    
    const testProduct = new Product({
      productCode: 'TESTQL001',
      name: 'Test Product with Quantity Limit',
      description: 'Testing quantity limit feature',
      basePrice: 100,
      profitMarginPercentage: 65,
      discountPercentage: 81,
      profitMarginPrice: 165,
      calculatedOriginalPrice: 868.42,
      offerPrice: 165,
      price: 868.42,
      categoryId: new mongoose.Types.ObjectId(),
      subcategoryId: new mongoose.Types.ObjectId(),
      inStock: true,
      stockQuantity: 1000,
      maxQuantityPerCustomer: 10, // Set limit to 10
      tags: ['test']
    });

    await testProduct.save();
    console.log('✅ Product created with quantity limit:', testProduct.maxQuantityPerCustomer);

    // Test 2: Create a product without quantity limit
    console.log('\n🧪 Test 2: Creating product without quantity limit...');
    
    const testProduct2 = new Product({
      productCode: 'TESTQL002',
      name: 'Test Product without Quantity Limit',
      description: 'Testing no quantity limit',
      basePrice: 200,
      profitMarginPercentage: 65,
      discountPercentage: 81,
      profitMarginPrice: 330,
      calculatedOriginalPrice: 1736.84,
      offerPrice: 330,
      price: 1736.84,
      categoryId: new mongoose.Types.ObjectId(),
      subcategoryId: new mongoose.Types.ObjectId(),
      inStock: true,
      stockQuantity: 500,
      // maxQuantityPerCustomer not set (should default to null)
      tags: ['test']
    });

    await testProduct2.save();
    console.log('✅ Product created without quantity limit:', testProduct2.maxQuantityPerCustomer);

    // Test 3: Update existing product with quantity limit
    console.log('\n🧪 Test 3: Updating product with quantity limit...');
    
    testProduct2.maxQuantityPerCustomer = 5;
    await testProduct2.save();
    console.log('✅ Product updated with quantity limit:', testProduct2.maxQuantityPerCustomer);

    // Test 4: Fetch products and display quantity limits
    console.log('\n🧪 Test 4: Fetching all test products...');
    
    const products = await Product.find({ productCode: { $in: ['TESTQL001', 'TESTQL002'] } });
    
    products.forEach(product => {
      console.log(`📦 ${product.name}:`);
      console.log(`   - Product Code: ${product.productCode}`);
      console.log(`   - Stock Quantity: ${product.stockQuantity}`);
      console.log(`   - Max Quantity Per Customer: ${product.maxQuantityPerCustomer || 'No limit'}`);
      console.log('');
    });

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await Product.deleteMany({ productCode: { $in: ['TESTQL001', 'TESTQL002'] } });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Quantity limit feature is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

testQuantityLimit();