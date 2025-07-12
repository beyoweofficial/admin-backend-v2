const mongoose = require('./config/db');
const Admin = require('./models/Admin');

async function checkAdmins() {
  try {
    console.log('Checking existing admin users...\n');
    
    // Get all admin users
    const admins = await Admin.find({});
    
    if (admins.length === 0) {
      console.log('❌ No admin users found in the database!');
      console.log('This is likely why login is failing.');
      console.log('Please run: node create-admin.js to create an admin user');
    } else {
      console.log(`✅ Found ${admins.length} admin user(s):`);
      console.log('----------------------------------------');
      
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. Name: ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Branch: ${admin.branch}`);
        console.log(`   Active: ${admin.isActive}`);
        console.log(`   Created: ${admin.createdAt}`);
        console.log('----------------------------------------');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking admins:', error);
    process.exit(1);
  }
}

// Run the function
checkAdmins();