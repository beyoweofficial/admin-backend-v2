// Simple test script to check if the Quick Shopping API works
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Test function
async function testQuickShoppingAPI() {
  try {
    console.log('Testing Quick Shopping API...');
    
    // Test categories with products endpoint
    const response = await axios.get(`${API_BASE_URL}/quick-shopping/categories-with-products`);
    
    console.log('✅ Categories with products API working!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      console.log(`Found ${response.data.data.length} categories with products`);
      response.data.data.forEach((category, index) => {
        console.log(`${index + 1}. ${category.name} - ${category.products.length} products`);
      });
    }
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    console.error('Error Code:', error.code);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    console.error('Full error:', error);
  }
}

// Run the test
testQuickShoppingAPI();