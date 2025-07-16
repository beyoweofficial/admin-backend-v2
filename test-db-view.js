const QuickShopping = require('./models/QuickShopping');
const mongoose = require('mongoose');
require('dotenv').config();

async function testDBViewEndpoint() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/admin-panel');
    console.log('✅ Connected to MongoDB');

    // Find a quick shopping record
    const quickShopping = await QuickShopping.findOne().lean();
    
    if (!quickShopping) {
      console.log('❌ No QuickShopping record found in database');
      console.log('💡 Create a quick shopping configuration first by:');
      console.log('   1. Go to /quick-shopping page');
      console.log('   2. Arrange categories and products');
      console.log('   3. Click "Save & Continue"');
      return;
    }

    console.log('✅ Found QuickShopping record:');
    console.log('📄 Document ID:', quickShopping._id);
    console.log('👤 Admin ID:', quickShopping.adminId);
    console.log('🏢 Branch:', quickShopping.branch);
    console.log('📦 Categories:', quickShopping.categoryOrder.length);
    
    // Test the formatting that the API endpoint will do
    const formattedData = {
      ...quickShopping,
      _id: quickShopping._id.toString(),
      adminId: quickShopping.adminId.toString(),
      categoryOrder: quickShopping.categoryOrder.map(cat => ({
        ...cat,
        _id: cat._id.toString(),
        categoryId: cat.categoryId.toString(),
        products: cat.products.map(prod => ({
          ...prod,
          _id: prod._id.toString(),
          productId: prod.productId.toString()
        }))
      }))
    };

    console.log('\n📊 Formatted structure preview:');
    console.log(JSON.stringify(formattedData, null, 2));
    
    console.log('\n🎯 Database View API endpoint should work correctly!');
    console.log('🌐 Test it at: http://localhost:5001/api/quick-shopping/raw');
    
  } catch (error) {
    console.error('❌ Error testing DB view endpoint:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

testDBViewEndpoint();