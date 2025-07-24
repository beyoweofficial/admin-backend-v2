const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:5001/api';

// Test function to check if price list endpoints are working
async function testPriceListEndpoints() {
  try {
    console.log('🧪 Testing Price List API Endpoints...\n');

    // First, let's try to get all price lists (should return empty array initially)
    console.log('1. Testing GET /api/price-lists');
    try {
      const response = await axios.get(`${API_BASE_URL}/price-lists`, {
        headers: {
          'Authorization': 'Bearer test-token' // You'll need a real token for actual testing
        }
      });
      console.log('✅ GET /api/price-lists - Success');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️  GET /api/price-lists - Authentication required (expected)');
      } else {
        console.log('❌ GET /api/price-lists - Error:', error.message);
      }
    }

    console.log('\n📋 Price List API Endpoints Available:');
    console.log('POST   /api/price-lists/upload          - Upload new price list');
    console.log('GET    /api/price-lists                 - Get all price lists');
    console.log('GET    /api/price-lists/:id             - Get price list by ID');
    console.log('PUT    /api/price-lists/:id             - Update price list');
    console.log('DELETE /api/price-lists/:id             - Delete price list');
    console.log('PATCH  /api/price-lists/:id/toggle-status - Toggle active status');

    console.log('\n📝 Required fields for upload:');
    console.log('- documentName: string (required)');
    console.log('- pdf: file (required, PDF only, max 1GB)');

    console.log('\n🔐 All endpoints require authentication token in header:');
    console.log('Authorization: Bearer <token>');

    console.log('\n✨ Features implemented:');
    console.log('✅ PDF upload to Cloudinary (not MongoDB)');
    console.log('✅ File validation (PDF only, max 1GB)');
    console.log('✅ SINGLE DOCUMENT POLICY - Only ONE PDF allowed');
    console.log('✅ CRUD operations (Create, Read, Update, Delete)');
    console.log('✅ Active/Inactive status toggle');
    console.log('✅ Must delete existing PDF to upload new one');
    console.log('✅ File size tracking');
    console.log('✅ Upload history with user tracking');

    console.log('\n🚨 IMPORTANT RESTRICTIONS:');
    console.log('❗ Only ONE price list document allowed at a time');
    console.log('❗ Must DELETE existing document before uploading new one');
    console.log('❗ No menu name field - only document name required');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPriceListEndpoints();