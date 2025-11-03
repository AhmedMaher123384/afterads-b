import mongoose from 'mongoose';
import User from '../models/User.js';
import { config, getMongoUri } from '../config.js';

// MongoDB connection
const MONGODB_URI = getMongoUri();

async function createStaffUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, config.mongodb.options);
    
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'a@a' });
    
    if (existingUser) {
      console.log('⚠️ User already exists');
      console.log('User details:', {
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        isActive: existingUser.isActive
      });
      return;
    }

    // Get next ID
    const lastUser = await User.findOne({}, {}, { sort: { id: -1 } });
    const nextId = lastUser ? lastUser.id + 1 : 1;

    // Create user
    const newUser = new User({
      id: nextId,
      name: 'Test User',
      email: 'a@a',
      password: '123456', // Will be hashed automatically
      role: 'staff',
      isActive: true
    });

    await newUser.save();
    
    console.log('✅ User created successfully!');
    console.log('Login details:');
    console.log('Email: a@a');
    console.log('Password: 123456');
    console.log('Role: staff');
    console.log('');
    console.log('🎯 You can now login with these credentials');
    
  } catch (error) {
    console.error('❌ Error creating staff user:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createStaffUser();
}

export default createStaffUser;