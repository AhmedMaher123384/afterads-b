import mongoose from 'mongoose';

const loginLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // قد يكون null في حالة فشل تسجيل الدخول
  },
  userName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['admin', 'staff', 'customer'],
    default: null
  },
  success: {
    type: Boolean,
    required: true
  },
  failureReason: {
    type: String,
    enum: [
      'invalid_credentials',
      'user_not_found',
      'account_locked',
      'account_inactive',
      'too_many_attempts',
      'invalid_email_format',
      'server_error'
    ],
    default: null
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: null
  },
  location: {
    country: String,
    city: String,
    region: String
  },
  sessionId: {
    type: String,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// إنشاء فهارس للبحث السريع
loginLogSchema.index({ userId: 1, createdAt: -1 });
loginLogSchema.index({ email: 1, createdAt: -1 });
loginLogSchema.index({ success: 1, createdAt: -1 });
loginLogSchema.index({ ipAddress: 1, createdAt: -1 });
loginLogSchema.index({ createdAt: -1 });

export default mongoose.model('LoginLog', loginLogSchema);