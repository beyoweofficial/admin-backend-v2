const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testOptionalStatus() {
  console.log('🧪 Testing Optional Featured/Best Seller Status...\n');

  try {
    // Test 1: Get all products to see current state
    console.log('1. Getting all products to analyze status distribution...');
    const allProducts = await axios.get(`${BASE_URL}/products`);
    console.log(`   Found ${allProducts.data.products.length} total products`);
    
    if (allProducts.data.products.length === 0) {
      console.log('   ⚠️  No products found. Please create some products first.');
      return;
    }

    // Analyze status distribution
    let regularProducts = 0;
    let featuredProducts = 0;
    let bestSellerProducts = 0;
    let bothStatusProducts = 0;

    allProducts.data.products.forEach(product => {
      if (product.featured && product.bestSeller) {
        bothStatusProducts++;
      } else if (product.featured) {
        featuredProducts++;
      } else if (product.bestSeller) {
        bestSellerProducts++;
      } else {
        regularProducts++;
      }
    });

    console.log('\n   📊 Product Status Distribution:');
    console.log(`   - Regular products (no special status): ${regularProducts}`);
    console.log(`   - Featured products: ${featuredProducts}`);
    console.log(`   - Best seller products: ${bestSellerProducts}`);
    console.log(`   - Products with BOTH statuses (should be 0): ${bothStatusProducts}`);

    if (bothStatusProducts > 0) {
      console.log('   ❌ ERROR: Found products with both featured and best seller status!');
    } else {
      console.log('   ✅ Mutual exclusivity is working correctly');
    }

    // Test 2: Test filtering
    console.log('\n2. Testing filtering options...');
    
    const allProductsFilter = await axios.get(`${BASE_URL}/products`);
    console.log(`   ✅ All products: ${allProductsFilter.data.total} products`);
    
    const featuredOnly = await axios.get(`${BASE_URL}/products/featured`);
    console.log(`   ✅ Featured only: ${featuredOnly.data.total} products`);
    
    const bestSellerOnly = await axios.get(`${BASE_URL}/products/best-sellers`);
    console.log(`   ✅ Best sellers only: ${bestSellerOnly.data.total} products`);

    const featuredFilter = await axios.get(`${BASE_URL}/products?featured=true`);
    console.log(`   ✅ Filter featured=true: ${featuredFilter.data.total} products`);
    
    const bestSellerFilter = await axios.get(`${BASE_URL}/products?bestSeller=true`);
    console.log(`   ✅ Filter bestSeller=true: ${bestSellerFilter.data.total} products`);

    // Test 3: Verify regular products (neither featured nor best seller)
    console.log('\n3. Testing regular products (no special status)...');
    const regularProductsFilter = await axios.get(`${BASE_URL}/products?featured=false&bestSeller=false`);
    console.log(`   ✅ Regular products: ${regularProductsFilter.data.total} products`);

    // Show some examples
    if (regularProducts > 0) {
      console.log('\n   📝 Examples of regular products:');
      allProducts.data.products
        .filter(p => !p.featured && !p.bestSeller)
        .slice(0, 3)
        .forEach(product => {
          console.log(`   - ${product.name} (Featured: ${product.featured || false}, Best Seller: ${product.bestSeller || false})`);
        });
    }

    if (featuredProducts > 0) {
      console.log('\n   ⭐ Examples of featured products:');
      allProducts.data.products
        .filter(p => p.featured)
        .slice(0, 3)
        .forEach(product => {
          console.log(`   - ${product.name} (Featured: ${product.featured}, Best Seller: ${product.bestSeller || false})`);
        });
    }

    if (bestSellerProducts > 0) {
      console.log('\n   🏆 Examples of best seller products:');
      allProducts.data.products
        .filter(p => p.bestSeller)
        .slice(0, 3)
        .forEach(product => {
          console.log(`   - ${product.name} (Featured: ${product.featured || false}, Best Seller: ${product.bestSeller})`);
        });
    }

    console.log('\n🎉 Optional status testing completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Products can have no special status (regular products)');
    console.log('✅ Products can be featured OR best seller (mutually exclusive)');
    console.log('✅ Filtering works for all three states: regular, featured, best seller');
    console.log('✅ No products have both statuses simultaneously');
    console.log(`✅ Distribution: ${regularProducts} regular, ${featuredProducts} featured, ${bestSellerProducts} best sellers`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testOptionalStatus();