import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  id: { 
    type: Number, 
    unique: true 
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'staff'],
    default: 'staff'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: {
    canViewOrders: { type: Boolean, default: true },
    canEditOrders: { type: Boolean, default: false },
    canDeleteOrders: { type: Boolean, default: false },
    canViewProducts: { type: Boolean, default: false },
    canEditProducts: { type: Boolean, default: false },
    canViewCustomers: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canManageSettings: { type: Boolean, default: false }
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Set permissions based on role
userSchema.pre('save', function(next) {
  if (this.role === 'admin') {
    this.permissions = {
      canViewOrders: true,
      canEditOrders: true,
      canDeleteOrders: true,
      canViewProducts: true,
      canEditProducts: true,
      canViewCustomers: true,
      canViewReports: true,
      canManageUsers: true,
      canManageSettings: true
    };
  } else if (this.role === 'staff') {
    this.permissions = {
      canViewOrders: true,
      canEditOrders: false,
      canDeleteOrders: false,
      canViewProducts: false,
      canEditProducts: false,
      canViewCustomers: false,
      canViewReports: false,
      canManageUsers: false,
      canManageSettings: false
    };
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: Date.now() }
  });
};

const User = mongoose.model('User', userSchema);

export default User;