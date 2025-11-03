import mongoose from 'mongoose';
import User from '../models/User.js';
import { config, getMongoUri } from '../config.js';

// MongoDB connection
const MONGODB_URI = getMongoUri();

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, config.mongodb.options);
    
    console.log('✅ Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@ghem.store' });
    
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists');
      console.log('Admin details:', {
        name: existingAdmin.name,
        email: existingAdmin.email,
        role: existingAdmin.role,
        isActive: existingAdmin.isActive
      });
      return;
    }

    // Get next ID
    const lastUser = await User.findOne({}, {}, { sort: { id: -1 } });
    const nextId = lastUser ? lastUser.id + 1 : 1;

    // Create admin user
    const adminUser = new User({
      id: nextId,
      name: 'مدير النظام',
      email: 'admin@ghem.store',
      password: 'admin123456', // Will be hashed automatically
      role: 'admin',
      isActive: true
    });

    await adminUser.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('Admin login details:');
    console.log('Email: admin@ghem.store');
    console.log('Password: admin123456');
    console.log('Role: admin');
    console.log('');
    console.log('⚠️ Please change the default password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
// Run the function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createAdminUser();
}

export default createAdminUser;