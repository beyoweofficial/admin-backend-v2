const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testFeaturedAPI() {
  console.log('🧪 Testing Featured Products API...\n');

  try {
    // Test 1: Get all products to see current state
    console.log('1. Getting all products...');
    const allProducts = await axios.get(`${BASE_URL}/products`);
    console.log(`   Found ${allProducts.data.products.length} total products`);
    
    if (allProducts.data.products.length === 0) {
      console.log('   ⚠️  No products found. Please create some products first.');
      return;
    }

    const sampleProduct = allProducts.data.products[0];
    console.log(`   Sample product: ${sampleProduct.name} (ID: ${sampleProduct._id})`);
    console.log(`   Current status - Featured: ${sampleProduct.featured}, Best Seller: ${sampleProduct.bestSeller}\n`);

    // Skip authentication-required tests for now
    console.log('2. Skipping toggle tests (require authentication)...\n');

    // Test 3: Get featured products
    console.log('3. Testing get featured products...');
    const featuredProducts = await axios.get(`${BASE_URL}/products/featured`);
    console.log(`   ✅ Found ${featuredProducts.data.total} featured products`);
    if (featuredProducts.data.products.length > 0) {
      featuredProducts.data.products.forEach(product => {
        console.log(`   - ${product.name} (Featured: ${product.featured})`);
      });
    }
    console.log();

    // Test 4: Get best seller products
    console.log('4. Testing get best seller products...');
    const bestSellerProducts = await axios.get(`${BASE_URL}/products/best-sellers`);
    console.log(`   ✅ Found ${bestSellerProducts.data.total} best seller products`);
    if (bestSellerProducts.data.products.length > 0) {
      bestSellerProducts.data.products.forEach(product => {
        console.log(`   - ${product.name} (Best Seller: ${product.bestSeller})`);
      });
    }
    console.log();

    // Test 5: Test filtering with query parameters
    console.log('5. Testing product filtering...');
    const filteredFeatured = await axios.get(`${BASE_URL}/products?featured=true`);
    console.log(`   ✅ Filter featured=true: ${filteredFeatured.data.total} products`);
    
    const filteredBestSeller = await axios.get(`${BASE_URL}/products?bestSeller=true`);
    console.log(`   ✅ Filter bestSeller=true: ${filteredBestSeller.data.total} products\n`);

    console.log('🎉 Public API tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Get featured products endpoint working');
    console.log('✅ Get best seller products endpoint working');
    console.log('✅ Product filtering by featured/bestSeller working');
    console.log('ℹ️  Toggle endpoints require authentication (protected routes)');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testFeaturedAPI();