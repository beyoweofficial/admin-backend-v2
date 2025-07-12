const mongoose = require('./config/db');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin already exists with email: admin@example.com');
      return;
    }

    // Hash the password
    const password = 'admin123'; // Change this to your desired password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = new Admin({
      name: 'Admin User',
      email: 'admin@example.com', // Change this to your desired email
      password: hashedPassword,
      branch: 'main', // Change this to your desired branch
      isActive: true
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Password:', password);
    console.log('Branch:', admin.branch);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

// Run the function
createAdmin();