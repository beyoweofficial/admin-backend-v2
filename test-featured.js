const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const mongoUri = process.env.SUPERADMIN_DB_URI || 'mongodb://localhost:27017/admin-crackers';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Product = require('./models/Product');

async function testFeaturedField() {
  try {
    console.log('🧪 Testing Featured Product Field...\n');

    // Test 1: Check if featured field exists in schema
    console.log('1. Checking Product schema for featured field...');
    const schema = Product.schema;
    const featuredField = schema.paths.featured;
    
    if (featuredField) {
      console.log('✅ Featured field exists in schema');
      console.log('   Type:', featuredField.instance);
      console.log('   Default:', featuredField.defaultValue);
    } else {
      console.log('❌ Featured field NOT found in schema');
    }

    // Test 2: Create a test product with featured = true
    console.log('\n2. Creating test product with featured = true...');
    
    const testProduct = new Product({
      productCode: 'TESTFEATURED001',
      name: 'Test Featured Product',
      description: 'This is a test featured product',
      basePrice: 100,
      profitMarginPercentage: 65,
      discountPercentage: 81,
      profitMarginPrice: 165,
      calculatedOriginalPrice: 868.42,
      offerPrice: 165,
      price: 868.42,
      categoryId: new mongoose.Types.ObjectId(),
      subcategoryId: new mongoose.Types.ObjectId(),
      featured: true, // This should be stored
      bestSeller: false,
      inStock: true,
      isActive: true,
    });

    const savedProduct = await testProduct.save();
    console.log('✅ Product created successfully');
    console.log('   Product ID:', savedProduct._id);
    console.log('   Featured value:', savedProduct.featured);
    console.log('   Best Seller value:', savedProduct.bestSeller);

    // Test 3: Retrieve the product and check featured field
    console.log('\n3. Retrieving product from database...');
    const retrievedProduct = await Product.findById(savedProduct._id);
    
    if (retrievedProduct) {
      console.log('✅ Product retrieved successfully');
      console.log('   Featured value from DB:', retrievedProduct.featured);
      console.log('   Type of featured field:', typeof retrievedProduct.featured);
    } else {
      console.log('❌ Product not found in database');
    }

    // Test 4: Update featured field
    console.log('\n4. Testing featured field update...');
    retrievedProduct.featured = false;
    await retrievedProduct.save();
    
    const updatedProduct = await Product.findById(savedProduct._id);
    console.log('✅ Product updated successfully');
    console.log('   Featured value after update:', updatedProduct.featured);

    // Test 5: Test filtering by featured
    console.log('\n5. Testing featured filter...');
    
    // Create another product with featured = false
    const testProduct2 = new Product({
      productCode: 'TESTFEATURED002',
      name: 'Test Non-Featured Product',
      description: 'This is a test non-featured product',
      basePrice: 100,
      profitMarginPercentage: 65,
      discountPercentage: 81,
      profitMarginPrice: 165,
      calculatedOriginalPrice: 868.42,
      offerPrice: 165,
      price: 868.42,
      categoryId: new mongoose.Types.ObjectId(),
      subcategoryId: new mongoose.Types.ObjectId(),
      featured: false,
      bestSeller: false,
      inStock: true,
      isActive: true,
    });
    
    await testProduct2.save();
    
    // Set first product back to featured = true
    updatedProduct.featured = true;
    await updatedProduct.save();
    
    // Query for featured products
    const featuredProducts = await Product.find({ featured: true });
    const nonFeaturedProducts = await Product.find({ featured: false });
    
    console.log('✅ Filter test completed');
    console.log('   Featured products found:', featuredProducts.length);
    console.log('   Non-featured products found:', nonFeaturedProducts.length);
    
    // Cleanup
    console.log('\n6. Cleaning up test data...');
    await Product.deleteOne({ _id: savedProduct._id });
    await Product.deleteOne({ _id: testProduct2._id });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    mongoose.connection.close();
  }
}

testFeaturedField();