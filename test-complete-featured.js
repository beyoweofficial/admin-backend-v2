const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Connect to MongoDB
const mongoUri = process.env.SUPERADMIN_DB_URI || 'mongodb://localhost:27017/admin-crackers';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Product = require('./models/Product');
const API_BASE = 'http://localhost:5001/api';

async function testCompleteFeatured() {
  try {
    console.log('🧪 Complete Featured Product Test...\n');

    // Step 1: Manually set one product to featured in database
    console.log('1. Setting up test data in database...');
    
    const products = await Product.find({}).limit(2);
    if (products.length < 2) {
      console.log('❌ Need at least 2 products in database for testing');
      return;
    }

    // Set first product to featured = true
    await Product.findByIdAndUpdate(products[0]._id, { featured: true });
    // Ensure second product is featured = false
    await Product.findByIdAndUpdate(products[1]._id, { featured: false });

    console.log('✅ Test data setup complete');
    console.log(`   Product 1: ${products[0].name} -> featured: true`);
    console.log(`   Product 2: ${products[1].name} -> featured: false`);

    // Step 2: Test API responses
    console.log('\n2. Testing API responses...');
    
    // Test all products
    const allResponse = await axios.get(`${API_BASE}/products`);
    const allProducts = allResponse.data.products || allResponse.data;
    
    const featuredInAll = allProducts.filter(p => p.featured === true);
    const nonFeaturedInAll = allProducts.filter(p => p.featured === false);
    
    console.log('✅ All products API test');
    console.log(`   Total products: ${allProducts.length}`);
    console.log(`   Featured products: ${featuredInAll.length}`);
    console.log(`   Non-featured products: ${nonFeaturedInAll.length}`);

    // Test featured filter
    const featuredResponse = await axios.get(`${API_BASE}/products?featured=true`);
    const featuredProducts = featuredResponse.data.products || featuredResponse.data;
    
    console.log('\n✅ Featured filter test');
    console.log(`   Products returned by featured=true filter: ${featuredProducts.length}`);
    
    if (featuredProducts.length > 0) {
      console.log(`   First featured product: ${featuredProducts[0].name} (featured: ${featuredProducts[0].featured})`);
    }

    // Test non-featured filter
    const nonFeaturedResponse = await axios.get(`${API_BASE}/products?featured=false`);
    const nonFeaturedProducts = nonFeaturedResponse.data.products || nonFeaturedResponse.data;
    
    console.log('\n✅ Non-featured filter test');
    console.log(`   Products returned by featured=false filter: ${nonFeaturedProducts.length}`);
    
    if (nonFeaturedProducts.length > 0) {
      console.log(`   First non-featured product: ${nonFeaturedProducts[0].name} (featured: ${nonFeaturedProducts[0].featured})`);
    }

    // Step 3: Test individual product retrieval
    console.log('\n3. Testing individual product retrieval...');
    
    const featuredProductResponse = await axios.get(`${API_BASE}/products/${products[0]._id}`);
    const featuredProduct = featuredProductResponse.data.product || featuredProductResponse.data;
    
    console.log('✅ Featured product retrieval');
    console.log(`   Product: ${featuredProduct.name}`);
    console.log(`   Featured: ${featuredProduct.featured} (${typeof featuredProduct.featured})`);
    console.log(`   Best Seller: ${featuredProduct.bestSeller} (${typeof featuredProduct.bestSeller})`);

    // Step 4: Verify filter accuracy
    console.log('\n4. Verifying filter accuracy...');
    
    const shouldBeFeatured = featuredProducts.every(p => p.featured === true);
    const shouldBeNonFeatured = nonFeaturedProducts.every(p => p.featured === false);
    
    console.log(`✅ Filter accuracy test`);
    console.log(`   All featured filter results are actually featured: ${shouldBeFeatured}`);
    console.log(`   All non-featured filter results are actually non-featured: ${shouldBeNonFeatured}`);

    // Step 5: Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   Database has ${featuredInAll.length} featured products and ${nonFeaturedInAll.length} non-featured products`);
    console.log(`   featured=true filter returns ${featuredProducts.length} products`);
    console.log(`   featured=false filter returns ${nonFeaturedProducts.length} products`);
    console.log(`   Filter accuracy: ${shouldBeFeatured && shouldBeNonFeatured ? '✅ CORRECT' : '❌ INCORRECT'}`);

    if (featuredProducts.length === featuredInAll.length && nonFeaturedProducts.length === nonFeaturedInAll.length) {
      console.log('\n🎉 ALL TESTS PASSED! Featured product functionality is working correctly.');
    } else {
      console.log('\n⚠️  FILTER ISSUE DETECTED! The filters are not returning the expected results.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Response:', error.response.data);
    }
  } finally {
    mongoose.connection.close();
  }
}

testCompleteFeatured();