const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const mongoUri = process.env.SUPERADMIN_DB_URI || 'mongodb://localhost:27017/admin-crackers';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Product = require('./models/Product');

async function migrateFeaturedField() {
  try {
    console.log('🔄 Migrating existing products to add featured field...\n');

    // Find all products that don't have the featured field
    const productsWithoutFeatured = await Product.find({ 
      featured: { $exists: false } 
    });

    console.log(`Found ${productsWithoutFeatured.length} products without featured field`);

    if (productsWithoutFeatured.length === 0) {
      console.log('✅ All products already have the featured field');
      return;
    }

    // Update all products to have featured: false by default
    const updateResult = await Product.updateMany(
      { featured: { $exists: false } },
      { $set: { featured: false } }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} products`);
    console.log(`   Added featured: false to all existing products`);

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const allProducts = await Product.find({});
    const productsWithFeatured = allProducts.filter(p => p.featured !== undefined);
    const featuredProducts = allProducts.filter(p => p.featured === true);
    const nonFeaturedProducts = allProducts.filter(p => p.featured === false);

    console.log(`✅ Verification complete:`);
    console.log(`   Total products: ${allProducts.length}`);
    console.log(`   Products with featured field: ${productsWithFeatured.length}`);
    console.log(`   Featured products: ${featuredProducts.length}`);
    console.log(`   Non-featured products: ${nonFeaturedProducts.length}`);

    if (productsWithFeatured.length === allProducts.length) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('   All products now have the featured field');
    } else {
      console.log('\n⚠️  Migration incomplete - some products still missing featured field');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    mongoose.connection.close();
  }
}

migrateFeaturedField();