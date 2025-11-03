import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['admin', 'staff', 'system'],
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'order_status_changed', 
      'order_note_added', 
      'order_viewed', 
      'order_updated', 
      'order_created',
      'status_updated',
      'notes_updated',
      'order_deleted',
      'manage_user', 
      'user_created', 
      'user_updated', 
      'user_deleted', 
      'user_password_reset',
      'login_success',
      'login_failed'
    ]
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  orderNumber: {
    type: String,
    required: false
  },
  details: {
    type: String,
    required: true
  },
  previousValue: {
    type: String,
    default: null
  },
  newValue: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// إنشاء فهرس للبحث السريع
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ orderId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);