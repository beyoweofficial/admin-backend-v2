const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function debugFilter() {
  try {
    console.log('🔍 Debugging Featured Filter...\n');

    // Test different filter scenarios
    const tests = [
      { query: '', description: 'No filter' },
      { query: '?featured=true', description: 'Featured = true' },
      { query: '?featured=false', description: 'Featured = false' },
      { query: '?bestSeller=true', description: 'Best Seller = true' },
      { query: '?bestSeller=false', description: 'Best Seller = false' },
    ];

    for (const test of tests) {
      console.log(`Testing: ${test.description}`);
      console.log(`Query: GET /products${test.query}`);
      
      const response = await axios.get(`${API_BASE}/products${test.query}`);
      const products = response.data.products || response.data;
      
      console.log(`Results: ${products.length} products found`);
      
      if (products.length > 0) {
        const featuredCount = products.filter(p => p.featured === true).length;
        const nonFeaturedCount = products.filter(p => p.featured === false).length;
        const bestSellerCount = products.filter(p => p.bestSeller === true).length;
        
        console.log(`  - Featured: ${featuredCount}`);
        console.log(`  - Non-featured: ${nonFeaturedCount}`);
        console.log(`  - Best sellers: ${bestSellerCount}`);
        
        // Show first product details
        const first = products[0];
        console.log(`  - First product: ${first.name} (featured: ${first.featured}, bestSeller: ${first.bestSeller})`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugFilter();