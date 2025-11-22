// models/AnnouncementBar.js
import mongoose from 'mongoose';

const announcementBarSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'المحتوى مطلوب'],
    trim: true
  },
  link: {
    type: String,
    trim: true,
    default: null
  },
  backgroundColor: {
    type: String,
    required: true,
    default: '#000000',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'لون الخلفية يجب أن يكون بصيغة hex صحيحة'
    }
  },
  textColor: {
    type: String,
    required: true,
    default: '#FFFFFF',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'لون النص يجب أن يكون بصيغة hex صحيحة'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index للبحث السريع عن الشريط النشط
announcementBarSchema.index({ isActive: 1, createdAt: -1 });

const AnnouncementBar = mongoose.model('AnnouncementBar', announcementBarSchema);

export default AnnouncementBar;