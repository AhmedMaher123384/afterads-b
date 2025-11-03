import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminPinSchema = new mongoose.Schema({
  id: {
    type: Number,
    default: 1,
    unique: true
  },
  pin: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 4,
    validate: {
      validator: function(v) {
        return /^\d{4}$/.test(v);
      },
      message: 'PIN must be exactly 4 digits'
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// تشفير PIN قبل الحفظ
adminPinSchema.pre('save', async function(next) {
  if (!this.isModified('pin')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.pin = await bcrypt.hash(this.pin, salt);
    this.lastUpdated = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// مقارنة PIN
adminPinSchema.methods.comparePin = async function(candidatePin) {
  try {
    return await bcrypt.compare(candidatePin, this.pin);
  } catch (error) {
    throw error;
  }
};

// إنشاء أو تحديث PIN
adminPinSchema.statics.createOrUpdatePin = async function(newPin, updatedBy) {
  try {
    let pinRecord = await this.findOne({ id: 1 });
    
    if (pinRecord) {
      pinRecord.pin = newPin;
      pinRecord.updatedBy = updatedBy;
      pinRecord.lastUpdated = new Date();
    } else {
      pinRecord = new this({
        id: 1,
        pin: newPin,
        updatedBy: updatedBy
      });
    }
    
    await pinRecord.save();
    return pinRecord;
  } catch (error) {
    throw error;
  }
};

// الحصول على PIN الحالي
adminPinSchema.statics.getCurrentPin = async function() {
  try {
    let pinRecord = await this.findOne({ id: 1 });
    
    if (!pinRecord) {
      // إنشاء PIN افتراضي إذا لم يوجد
      pinRecord = new this({
        id: 1,
        pin: '0000',
        updatedBy: 'system'
      });
      await pinRecord.save();
    }
    
    return pinRecord;
  } catch (error) {
    throw error;
  }
};

const AdminPin = mongoose.model('AdminPin', adminPinSchema);

export default AdminPin;